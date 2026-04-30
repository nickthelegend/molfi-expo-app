import { useState, useCallback } from 'react';
import { createPublicClient, createWalletClient, custom, http, parseUnits, formatUnits, getAddress } from 'viem';
import { polygon } from 'viem/chains';
import { useAccount, useProvider } from '@reown/appkit-react-native';
import { ogChain } from '@/constants/SwapConfig';

// ─── Li.Fi API base ───────────────────────────────────────────────────────
const LIFI_API = 'https://li.quest/v1';

// Wormhole uses internal IDs, not standard EVM IDs
const WORMHOLE_CHAIN_IDS: Record<number, number> = {
  1: 2,      // Ethereum
  137: 5,    // Polygon
  8453: 30,  // Base
  42161: 23, // Arbitrum
  16601: 16601, // 0G
};

// ─── 0G Bridge Contract ──────────────────────────────────────────────────
const OG_BRIDGE_CONTRACT = '0xC699482c17d43b7D5349F2D3f58d61fEFA972B8c';

// Standard Bridge ABI (Wormhole/Native compatible)
const BRIDGE_ABI = [
  {
    name: 'bridgeTokens',
    type: 'function',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'destinationChainId', type: 'uint16' },
      { name: 'recipient', type: 'bytes32' }
    ],
    outputs: [],
    stateMutability: 'payable',
  }
] as const;

export type BridgeStep =
  | 'idle'
  | 'fetching_route'
  | 'approving'
  | 'waiting_approval'
  | 'initiating'
  | 'waiting_source'
  | 'relaying'
  | 'done'
  | 'error';

export type BridgeQuote = {
  estimatedOutputAmount: string;      // formatted on destination
  estimatedTime: string;              // e.g. "~2 minutes"
  relayerFee: string;                 // formatted in source token
  provider: string;
  transactionRequest?: {              // The actual data for wallet signing
    to: string;
    data: string;
    value: string;
  };
};

export type BridgeParams = {
  fromChainId: number;
  toChainId: number;
  tokenAddress: `0x${string}`;
  toTokenAddress: `0x${string}`;
  tokenSymbol: string;
  tokenDecimals: number;
  amount: string;                     // human-readable
  destinationAddress?: `0x${string}`; // defaults to connected wallet
};

export type UseBridgeReturn = {
  step: BridgeStep;
  quote: BridgeQuote | null;
  sourceTxHash: string | null;
  error: string | null;
  getRoute: (params: BridgeParams) => Promise<BridgeQuote | null>;
  executeBridge: (params: BridgeParams) => Promise<string | null>;
  reset: () => void;
};

const ogPublicClient = createPublicClient({
  chain: ogChain,
  transport: http('https://evmrpc.0g.ai', {
    timeout: 30000,
    retryCount: 3,
  }),
});

export function useBridge(): UseBridgeReturn {
  const { address } = useAccount();
  const { provider: walletProvider } = useProvider();

  const [step, setStep]               = useState<BridgeStep>('idle');
  const [quote, setQuote]             = useState<BridgeQuote | null>(null);
  const [sourceTxHash, setSourceTxHash] = useState<string | null>(null);
  const [error, setError]             = useState<string | null>(null);

  // Orchestra-style internal estimator when public relayers are rate-limited
  const getInternalEstimation = useCallback((params: BridgeParams): BridgeQuote => {
    console.log('[Bridge] Generating internal estimation...');
    const amount = parseFloat(params.amount);
    const fee = amount * 0.003; 
    return {
      estimatedOutputAmount: (amount - fee).toFixed(6),
      estimatedTime: '~5 minutes',
      relayerFee: fee.toFixed(6),
      provider: 'agent-estimate',
    };
  }, []);

  // ── Fetch Route ──────────────────────────────────────────────────────────
  const getRoute = useCallback(async (params: BridgeParams): Promise<BridgeQuote | null> => {
    if (!address) return null;
    console.log('[Bridge] Fetching route started...', { params });
    setStep('fetching_route');
    setError(null);

    try {
      const url = new URL(`${LIFI_API}/quote`);
      url.searchParams.set('fromChain', params.fromChainId.toString());
      url.searchParams.set('toChain', params.toChainId.toString());
      url.searchParams.set('fromToken', params.tokenAddress);
      url.searchParams.set('toToken', params.toTokenAddress);
      url.searchParams.set('fromAmount', parseUnits(params.amount, params.tokenDecimals).toString());
      url.searchParams.set('fromAddress', address);

      console.log('[Bridge] Calling Li.Fi:', url.toString());
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errText = await response.text();
        console.warn('[Bridge] Li.Fi API error:', response.status, errText);
        const est = getInternalEstimation(params);
        setQuote(est);
        setStep('idle');
        return est;
      }

      const data = await response.json();
      console.log('[Bridge] Li.Fi response success:', data);

      const result: BridgeQuote = {
        estimatedOutputAmount: formatUnits(BigInt(data.estimate.toAmount), data.action.toToken.decimals),
        estimatedTime: `~${Math.ceil((data.estimate.executionDuration ?? 300) / 60)} minutes`,
        relayerFee: formatUnits(BigInt(data.estimate.feeCosts?.[0]?.amount ?? '0'), params.tokenDecimals),
        provider: data.tool ?? 'lifi',
        transactionRequest: data.transactionRequest,
      };

      setQuote(result);
      setStep('idle');
      return result;
    } catch (e: any) {
      console.warn('[Bridge] Route fetch error, using fallback:', e);
      const est = getInternalEstimation(params);
      setQuote(est);
      setStep('idle');
      return est;
    }
  }, [address, getInternalEstimation]);

  // ── Execute Bridge ────────────────────────────────────────────────────────
  const executeBridge = useCallback(async (params: BridgeParams): Promise<string | null> => {
    console.log('[Bridge] EXECUTION INITIATED', { params, user: address });
    
    if (!address || !walletProvider) {
      console.error('[Bridge] MISSING WALLET OR PROVIDER');
      setError('Wallet not connected');
      setStep('error');
      return null;
    }

    setError(null);

    try {
      setStep('initiating');
      console.log('[Bridge] Creating Wallet Client...');
      const walletClient = createWalletClient({
        chain: ogChain,
        transport: custom(walletProvider as any),
        account: getAddress(address),
      });

      // NEW: Check for gas funds before signing
      console.log('[Bridge] Checking gas balance for:', address);
      const balance = await ogPublicClient.getBalance({ address: getAddress(address) });
      console.log('[Bridge] Native balance (A0GI):', formatUnits(balance, 18));

      if (balance === BigInt(0)) {
        console.error('[Bridge] EXECUTION HALTED: 0 A0GI detected.');
        throw new Error('Insufficient A0GI for gas. Please fund your wallet to sign on-chain.');
      }

      const recipientBytes32 = getAddress(address).padEnd(66, '0') as `0x${string}`;
      const amountRaw = parseUnits(params.amount, params.tokenDecimals);
      const targetChainId = WORMHOLE_CHAIN_IDS[params.toChainId] || 5;

      console.log('[Bridge] TX PAYLOAD:', {
        contract: OG_BRIDGE_CONTRACT,
        token: params.tokenAddress,
        amount: amountRaw.toString(),
        toChain: targetChainId,
        recipient: recipientBytes32
      });

      console.log('[Bridge] Requesting Wallet Signature (fixed gas 300k)...');
      
      const hash = await walletClient.writeContract({
        address: getAddress(OG_BRIDGE_CONTRACT),
        abi: BRIDGE_ABI,
        functionName: 'bridgeTokens',
        args: [
          getAddress(params.tokenAddress),
          amountRaw,
          targetChainId,
          recipientBytes32
        ],
        account: getAddress(address),
        chain: ogChain,
        gas: BigInt(300000), // Bypass estimation to prevent timeouts
      });

      console.log('[Bridge] SIGNATURE RECEIVED! Hash:', hash);
      setStep('waiting_source');
      
      console.log('[Bridge] Waiting for 0G confirmation (max 60s)...');
      const receipt = await ogPublicClient.waitForTransactionReceipt({ 
        hash,
        timeout: 60000 
      });
      
      console.log('[Bridge] ON-CHAIN CONFIRMATION SUCCESS:', receipt);
      setSourceTxHash(hash);
      setStep('done');
      return hash;

    } catch (e: any) {
      console.error('[Bridge] FATAL ERROR DURING EXECUTION:', e);
      const msg = e?.shortMessage ?? e?.message ?? 'Bridge failed';
      setError(msg);
      setStep('error');
      return null;
    }
  }, [address, walletProvider, quote]);

  const reset = useCallback(() => {
    console.log('[Bridge] Resetting state...');
    setStep('idle');
    setQuote(null);
    setSourceTxHash(null);
    setError(null);
  }, []);

  return { step, quote, sourceTxHash, error, getRoute, executeBridge, reset };
}
