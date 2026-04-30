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
  ogChain,
  OG_CONTRACTS,
  POLYGON_CONTRACTS,
  FEE_TIERS,
  ERC20_ABI,
  QUOTER_V2_ABI,
  SWAP_ROUTER_ABI,
} from '@/constants/SwapConfig';

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
  chainId: 16661 | 137;             // 0G or Polygon
  tokenIn: `0x${string}`;
  tokenOut: `0x${string}`;
  tokenInDecimals: number;
  tokenOutDecimals: number;
  amountIn: string;                 // human-readable, e.g. "100"
  slippageBps?: number;             // basis points, default 50 (0.5%)
  recipientAddress?: `0x${string}`; // defaults to connected wallet
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
const ogPublicClient = createPublicClient({
  chain: ogChain,
  transport: http('https://evmrpc.0g.ai'),
});

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
  transport: http('https://cloudflare-eth.com'),
});

// ─── Helper: pick the right public client and contract addresses ──────────
function getChainConfig(chainId: number) {
  switch (chainId) {
    case 16661:
      return { publicClient: ogPublicClient, chain: ogChain, contracts: OG_CONTRACTS };
    case 137:
      return { publicClient: polygonPublicClient, chain: polygon, contracts: POLYGON_CONTRACTS };
    case 8453:
      return { publicClient: basePublicClient, chain: base, contracts: POLYGON_CONTRACTS }; // Uniswap V3 addresses are the same
    case 42161:
      return { publicClient: arbitrumPublicClient, chain: arbitrum, contracts: POLYGON_CONTRACTS };
    case 1:
      return { publicClient: ethPublicClient, chain: mainnet, contracts: POLYGON_CONTRACTS };
    default:
      throw new Error(`Chain ID ${chainId} is not supported for local swaps.`);
  }
}

// ─── Helper: try multiple fee tiers, return best quote ────────────────────
async function getBestQuote(
  publicClient: any,
  quoterAddress: `0x${string}`,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
): Promise<{ amountOut: bigint; fee: number; gasEstimate: bigint } | null> {
  const feeTiersToTry = [FEE_TIERS.MEDIUM, FEE_TIERS.LOW, FEE_TIERS.HIGH, FEE_TIERS.LOWEST];
  let best: { amountOut: bigint; fee: number; gasEstimate: bigint } | null = null;

  for (const fee of feeTiersToTry) {
    try {
      const result = await publicClient.simulateContract({
        address: quoterAddress,
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
      if (!best || amountOut > best.amountOut) {
        best = { amountOut, fee, gasEstimate };
      }
    } catch {
      // This fee tier has no pool — try next
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
    setStep('quoting');
    setError(null);
    setQuote(null);

    try {
      const { publicClient, contracts } = getChainConfig(params.chainId);
      const amountIn = parseUnits(params.amountIn, params.tokenInDecimals);

      const best = await getBestQuote(
        publicClient,
        contracts.QUOTER_V2,
        params.tokenIn,
        params.tokenOut,
        amountIn,
      );

      if (!best) throw new Error('No liquidity pool found for this pair on this chain.');

      const amountOutFormatted = formatUnits(best.amountOut, params.tokenOutDecimals);
      const priceImpact = '<0.5%'; // conservative — replace with pool slot0 read if needed

      // Gas cost in USD: estimate gas * 1 gwei * ETH price ~$3000 (rough)
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
      const msg = e?.shortMessage ?? e?.message ?? 'Quote failed';
      setError(msg);
      setStep('error');
      return null;
    }
  }, []);

  // ── 2. Execute Swap ─────────────────────────────────────────────────────
  const executeSwap = useCallback(async (params: SwapParams): Promise<string | null> => {
    if (!address || !walletProvider) {
      setError('Wallet not connected');
      setStep('error');
      return null;
    }

    setError(null);
    const { publicClient, chain, contracts } = getChainConfig(params.chainId);

    const walletClient = createWalletClient({
      chain,
      transport: custom(walletProvider as any),
      account: address as `0x${string}`,
    });

    try {
      const amountIn = parseUnits(params.amountIn, params.tokenInDecimals);
      const slippageBps = params.slippageBps ?? 50;

      // ── A. Get fresh quote ─────────────────────────────────────────────
      setStep('quoting');
      const best = await getBestQuote(
        publicClient,
        contracts.QUOTER_V2,
        params.tokenIn,
        params.tokenOut,
        amountIn,
      );
      if (!best) throw new Error('No route found. The pool may have insufficient liquidity.');

      const amountOutMinimum = best.amountOut * BigInt(10000 - slippageBps) / 10000n;

      // ── B. Check and handle ERC20 allowance ───────────────────────────
      const isNativeIn = params.tokenIn.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

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
      const msg = e?.shortMessage ?? e?.message ?? 'Swap failed';
      setError(msg);
      setStep('error');
      return null;
    }
  }, [address, walletProvider]);

  function reset() {
    setStep('idle');
    setQuote(null);
    setTxHash(null);
    setError(null);
  }

  return { step, quote, txHash, error, getQuote, executeSwap, reset };
}
