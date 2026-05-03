import { useState, useCallback } from 'react';
import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  parseUnits,
  formatUnits,
  encodeFunctionData,
  maxUint256,
} from 'viem';
import { polygon } from 'viem/chains';
import { useAccount, useProvider } from '@reown/appkit-react-native';
import { base, arbitrum, mainnet } from 'viem/chains';
import {
  POLYGON_CONTRACTS,
  UNISWAP_V3_CONTRACTS,
  FEE_TIERS,
  ERC20_ABI,
  QUOTER_V2_ABI,
  SWAP_ROUTER_ABI,
} from '@/constants/SwapConfig';

const WRAPPED_TOKENS: Record<number, `0x${string}`> = {
  1: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  137: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  8453: '0x4200000000000000000000000000000000000006', // WETH
  42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
};

function wrapAddress(chainId: number, address: string): `0x${string}` {
  const addr = address.toLowerCase();
  if (addr === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' || addr === '0x0000000000000000000000000000000000000000') {
    return WRAPPED_TOKENS[chainId] || (address as `0x${string}`);
  }
  return address as `0x${string}`;
}


// ─── Types ─────────────────────────────────────────────────────────────────

export type SwapStep =
  | 'idle'
  | 'quoting'
  | 'checking_allowance'
  | 'approving'
  | 'waiting_approval'
  | 'signing_swap'
  | 'waiting_confirmation'
  | 'done'
  | 'error';

export type SwapQuote = {
  amountOut: bigint;
  amountOutFormatted: string;
  fee: number;           // fee tier used (e.g. 3000)
  priceImpact: string;   // e.g. "0.12%"
  gasEstimate: bigint;
  gasCostUSD: string;    // estimated gas cost in USD
};

export type SwapParams = {
  chainId: number;                   // Supported: 1, 137, 8453, 42161
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  amountIn: string;                 
  slippageBps?: number;             
  recipientAddress?: `0x${string}`; 
};

export type UseSwapReturn = {
  step: SwapStep;
  quote: SwapQuote | null;
  txHash: string | null;
  error: string | null;
  getQuote: (params: SwapParams) => Promise<SwapQuote | null>;
  executeSwap: (params: SwapParams) => Promise<string | null>;
  reset: () => void;
};

// ─── Public clients (reads — no wallet needed) ────────────────────────────
const polygonPublicClient = createPublicClient({
  chain: polygon,
  transport: http('https://polygon-rpc.com'),
});

const basePublicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const arbitrumPublicClient = createPublicClient({
  chain: arbitrum,
  transport: http('https://arb1.arbitrum.io/rpc'),
});

const ethPublicClient = createPublicClient({
  chain: mainnet,
  transport: http('https://1rpc.io/eth'),
});

// ─── Helper: pick the right public client and contract addresses ──────────
function getChainConfig(chainId: number) {
  switch (chainId) {
    case 137:
    case 8453:
    case 42161:
    case 1:
      const clients: Record<number, any> = {
        137: polygonPublicClient,
        8453: basePublicClient,
        42161: arbitrumPublicClient,
        1: ethPublicClient
      };
      const chains: Record<number, any> = {
        137: polygon,
        8453: base,
        42161: arbitrum,
        1: mainnet
      };
      return { 
        publicClient: clients[chainId], 
        chain: chains[chainId], 
        contracts: UNISWAP_V3_CONTRACTS 
      };
    default:
      throw new Error(`Chain ID ${chainId} is not supported for swaps.`);
  }
}

// ─── Helper: try multiple fee tiers, return best quote ────────────────────
async function getBestQuote(
  publicClient: any,
  contracts: any,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
): Promise<{ amountOut: bigint; fee: number; gasEstimate: bigint } | null> {
  const feeTiersToTry = [FEE_TIERS.MEDIUM, FEE_TIERS.LOW, FEE_TIERS.HIGH, FEE_TIERS.LOWEST];
  let best: { amountOut: bigint; fee: number; gasEstimate: bigint } | null = null;

  for (const fee of feeTiersToTry) {
    try {
      console.log(`[getBestQuote] Trying fee tier: ${fee}`);
      
      const result = await publicClient.simulateContract({
        address: contracts.QUOTER_V2,
        abi: QUOTER_V2_ABI,
        functionName: 'quoteExactInputSingle',
        args: [{
          tokenIn,
          tokenOut,
          amountIn,
          fee,
          sqrtPriceLimitX96: 0n,
        }],
      });
      const [amountOut, , , gasEstimate] = result.result as [bigint, bigint, number, bigint];
      console.log(`[getBestQuote] Success for ${fee}: ${amountOut.toString()}`);
      
      if (!best || amountOut > best.amountOut) {
        best = { amountOut, fee, gasEstimate };
      }
    } catch (e: any) {
      console.warn(`[getBestQuote] Failed for ${fee}:`, e?.shortMessage || e?.message || e);
    }
  }
  return best;
}

// ─── The Hook ─────────────────────────────────────────────────────────────
export function useSwap(): UseSwapReturn {
  const { address } = useAccount();
  const { provider: walletProvider } = useProvider();

  const [step, setStep]     = useState<SwapStep>('idle');
  const [quote, setQuote]   = useState<SwapQuote | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);

  // ── 1. Get Quote ────────────────────────────────────────────────────────
  const getQuote = useCallback(async (params: SwapParams): Promise<SwapQuote | null> => {
    console.log('[useSwap] getQuote started', params);
    setStep('quoting');
    setError(null);
    setQuote(null);

    try {
      const { publicClient, contracts } = getChainConfig(params.chainId);
      
      // Fetch decimals dynamically if not provided or suspect
      let decimalsIn = params.tokenInDecimals;
      let decimalsOut = params.tokenOutDecimals;

      if (!decimalsIn || !decimalsOut || decimalsOut === 18) {
        try {
          const dIn = await publicClient.readContract({
            address: params.tokenIn,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }) as number;
          const dOut = await publicClient.readContract({
            address: params.tokenOut,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }) as number;
          decimalsIn = dIn;
          decimalsOut = dOut;
          console.log(`[useSwap] Fetched decimals: IN=${decimalsIn}, OUT=${decimalsOut}`);
        } catch (e) {
          console.warn('[useSwap] Failed to fetch decimals, falling back to params', e);
        }
      }

      const amountIn = parseUnits(params.amountIn, decimalsIn);
      const tokenIn = wrapAddress(params.chainId, params.tokenIn);
      const tokenOut = wrapAddress(params.chainId, params.tokenOut);

      console.log(`[useSwap] Fetching quote for ${params.amountIn} ${params.tokenIn} on chain ${params.chainId}...`);
      const best = await getBestQuote(
        publicClient,
        contracts,
        tokenIn,
        tokenOut,
        amountIn,
      );

      if (!best) {
        console.warn('[useSwap] No liquidity pool found');
        throw new Error('No liquidity pool found for this pair on this chain.');
      }

      console.log('[useSwap] Best quote found:', best);
      const amountOutFormatted = formatUnits(best.amountOut, decimalsOut);
      const priceImpact = '<0.5%'; 

      const gasCostUSD = `~$${(Number(best.gasEstimate) * 1e-9 * 3000).toFixed(4)}`;

      const result: SwapQuote = {
        amountOut: best.amountOut,
        amountOutFormatted,
        fee: best.fee,
        priceImpact,
        gasEstimate: best.gasEstimate,
        gasCostUSD,
      };

      setQuote(result);
      setStep('idle');
      return result;
    } catch (e: any) {
      console.error('[useSwap] getQuote error:', e);
      const msg = e?.shortMessage ?? e?.message ?? 'Quote failed';
      setError(msg);
      setStep('error');
      return null;
    }
  }, []);

  // ── 2. Execute Swap ─────────────────────────────────────────────────────
  const executeSwap = useCallback(async (params: SwapParams): Promise<string | null> => {
    console.log('[useSwap] executeSwap started', params);
    if (!address || !walletProvider) {
      setError('Wallet not connected');
      setStep('error');
      return null;
    }

    setError(null);
    const { publicClient, chain, contracts } = getChainConfig(params.chainId);

    // ── Pre-check: Ensure wallet is on the correct chain ─────────────────
    try {
      console.log(`[useSwap] Requesting chain switch to ${chain.name} (${chain.id})...`);
      await (walletProvider as any).request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chain.id.toString(16)}` }],
      });
      console.log('[useSwap] Chain switch request sent/successful.');
    } catch (e: any) {
      console.warn('[useSwap] Chain switch warning:', e.message);
    }

    // Fetch decimals dynamically
    let decimalsIn = params.tokenInDecimals;
    let decimalsOut = params.tokenOutDecimals;

    if (!decimalsIn || !decimalsOut || decimalsOut === 18) {
      try {
        const dIn = await publicClient.readContract({ address: params.tokenIn, abi: ERC20_ABI, functionName: 'decimals' }) as number;
        const dOut = await publicClient.readContract({ address: params.tokenOut, abi: ERC20_ABI, functionName: 'decimals' }) as number;
        decimalsIn = dIn;
        decimalsOut = dOut;
      } catch (e) {
        console.warn('[useSwap] Failed to fetch decimals in executeSwap, falling back');
      }
    }

    const amountIn = parseUnits(params.amountIn, decimalsIn);
    const slippageBps = params.slippageBps ?? 50;

    const walletClient = createWalletClient({
      chain,
      transport: custom(walletProvider as any),
      account: address as `0x${string}`,
    });

    try {

      // ── 0. Check Balance ───────────────────────────────────────────────
      const isNativeIn = params.tokenIn.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      const balance = isNativeIn 
        ? await publicClient.getBalance({ address: address as `0x${string}` })
        : await publicClient.readContract({
            address: params.tokenIn,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address as `0x${string}`],
          }) as bigint;

      console.log(`[useSwap] User balance: ${balance.toString()}, Required: ${amountIn.toString()}`);
      
      if (balance < amountIn) {
        throw new Error(`Insufficient balance. You have ${formatUnits(balance, decimalsIn)} ${params.symbolIn || 'tokens'} but need ${params.amountIn}.`);
      }

      // ── A. Get fresh quote ─────────────────────────────────────────────
      setStep('quoting');
      const tokenIn = wrapAddress(params.chainId, params.tokenIn);
      const tokenOut = wrapAddress(params.chainId, params.tokenOut);
      
      const best = await getBestQuote(
        publicClient,
        contracts,
        tokenIn,
        tokenOut,
        amountIn,
      );
      if (!best) throw new Error('No route found. The pool may have insufficient liquidity.');

      const amountOutMinimum = best.amountOut * BigInt(10000 - slippageBps) / 10000n;
      console.log(`[useSwap] Quote ready. Min output: ${amountOutMinimum.toString()}`);

      // ── B. Check and handle ERC20 allowance ───────────────────────────

      if (!isNativeIn) {
        setStep('checking_allowance');

        const allowance = await publicClient.readContract({
          address: params.tokenIn,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address as `0x${string}`, contracts.SWAP_ROUTER],
        }) as bigint;

        if (allowance < amountIn) {
          setStep('approving');
          console.log(`[useSwap] Current allowance (${allowance.toString()}) < required (${amountIn.toString()}). Approving...`);

          // Simulate first to catch errors
          await publicClient.simulateContract({
            address: params.tokenIn,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contracts.SWAP_ROUTER, maxUint256],
            account: address as `0x${string}`,
          });

          const approveHash = await walletClient.writeContract({
            address: params.tokenIn,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [contracts.SWAP_ROUTER, maxUint256],
          });

          setStep('waiting_approval');
          await publicClient.waitForTransactionReceipt({ hash: approveHash });
        }
      }

      // ── C. Execute exactInputSingle ────────────────────────────────────
      setStep('signing_swap');

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 min
      const recipient = params.recipientAddress ?? (address as `0x${string}`);

      const swapHash = await walletClient.writeContract({
        address: contracts.SWAP_ROUTER,
        abi: SWAP_ROUTER_ABI,
        functionName: 'exactInputSingle',
        args: [{
          tokenIn:           params.tokenIn,
          tokenOut:          params.tokenOut,
          fee:               best.fee,
          recipient,
          deadline,
          amountIn,
          amountOutMinimum,
          sqrtPriceLimitX96: 0n,
        }],
        value: isNativeIn ? amountIn : 0n,
      });

      setStep('waiting_confirmation');
      await publicClient.waitForTransactionReceipt({ hash: swapHash });

      setTxHash(swapHash);
      setStep('done');
      return swapHash;

    } catch (e: any) {
      console.error('[useSwap] executeSwap error:', e);
      const msg = e?.shortMessage ?? e?.message ?? 'Swap failed';
      setError(msg);
      setStep('error');
      return null;
    }
  }, [address, walletProvider]);

  const reset = useCallback(() => {
    setStep('idle');
    setQuote(null);
    setTxHash(null);
    setError(null);
  }, []);

  return { step, quote, txHash, error, getQuote, executeSwap, reset };
}
