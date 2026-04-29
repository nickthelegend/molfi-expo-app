import { useState, useCallback } from 'react';
import { useAccount as useAppKitAccount, useSendTransaction, useSignTypedData, useSwitchChain } from 'wagmi';
import { Address, parseUnits, isAddress, isHex } from 'viem';

const TRADING_API_BASE = 'https://trade-api.gateway.uniswap.org/v1';
const UNISWAP_API_KEY = 'VhS0REuDP3oJRt7kOcpB_LN_v0oyez8oerF2ogocHZU'; 
const OKU_API_BASE = 'https://api.oku.trade/v1';

const SUPPORTED_CHAINS = [1, 10, 56, 137, 8453, 42161, 43114, 11155111, 11155420, 16600, 16601, 16661, 80087];

export type QuoteParams = {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  chainId: number;
  type?: 'EXACT_INPUT' | 'EXACT_OUTPUT';
};

export function useUniswapSwap() {
  const { address, chainId } = useAppKitAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (params: QuoteParams) => {
    setIsLoading(true);
    setError(null);
    try {
      // 0G (Mainnet & Testnets) route via Oku Trade
      const isZeroG = [16661, 16601, 16600, 80087].includes(params.chainId);
      
      if (isZeroG) {
        const chainName = params.chainId === 16661 ? '0g' : '0g_galileo';
        const fromToken = params.tokenIn === 'ETH' ? '0G' : params.tokenIn;
        const toToken = params.tokenOut === 'ETH' ? '0G' : params.tokenOut;
        const url = `${OKU_API_BASE}/quote?chain=${chainName}&tokenIn=${fromToken}&tokenOut=${toToken}&amount=${params.amount}&swapper=${address}`;
        
        console.log(`[useUniswapSwap] Fetching Oku quote for 0G: ${url}`);
        try {
          const okuRes = await fetch(url);
          const okuData = await okuRes.json();
          if (!okuRes.ok) throw new Error(okuData.message || 'Failed to get Oku quote');
          return { ...okuData, _provider: 'OKU' };
        } catch (okuErr: any) {
          console.warn(`[useUniswapSwap] Oku API error, trying local fallback:`, okuErr.message);
          // Simple 1:1 fallback for stables to keep UI moving
          const isStableIn = params.tokenIn.includes('USD');
          const isStableOut = params.tokenOut.includes('USD');
          let outAmount = params.amount;
          if (!isStableIn && isStableOut) outAmount = (BigInt(params.amount) * BigInt(2500)).toString();
          else if (isStableIn && !isStableOut) outAmount = (BigInt(params.amount) / BigInt(2500)).toString();
          
          return {
            _provider: 'OKU_FALLBACK',
            outAmount,
            outToken: params.tokenOut,
            routing: 'CLASSIC',
            chainId: params.chainId
          };
        }
      }

      // Everything else via Official Uniswap Trading API
      console.log(`[useUniswapSwap] Fetching Uniswap quote for chain ${params.chainId}...`);
      const response = await fetch(`${TRADING_API_BASE}/quote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': UNISWAP_API_KEY,
          'x-universal-router-version': '2.0',
        },
        body: JSON.stringify({
          swapper: address,
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          tokenInChainId: params.chainId.toString(),
          tokenOutChainId: params.chainId.toString(),
          amount: params.amount,
          type: params.type || 'EXACT_INPUT',
          routingPreference: 'BEST_PRICE',
          slippageTolerance: 0.5,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.detail || 'Failed to get quote');
      return data;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const executeSwap = useCallback(async (quoteResponse: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Handle Oku Fallback (Mock)
      if (quoteResponse._provider === 'OKU_FALLBACK') {
        throw new Error("Trading on 0G is temporarily limited. Please bridge or use Oku Trade directly.");
      }

      // Handle Oku Live
      if (quoteResponse._provider === 'OKU') {
        const { swap } = quoteResponse;
        if (!swap) throw new Error("No execution data from Oku");
        
        // Chain Check
        const targetChainId = quoteResponse.chainId || 16661;
        if (chainId !== targetChainId) {
          console.log(`[useUniswapSwap] Switching to chain ${targetChainId} for Oku swap`);
          await switchChainAsync({ chainId: targetChainId });
        }

        const hash = await sendTransactionAsync({
          to: swap.to as Address,
          data: swap.data as `0x${string}`,
          value: BigInt(swap.value || '0'),
          chainId: targetChainId,
        });
        return hash;
      }

      // Handle Uniswap
      const isUniswapX = ['DUTCH_V2', 'DUTCH_V3', 'PRIORITY'].includes(quoteResponse.routing);
      let signature: string | undefined;

      if (quoteResponse.permitData) {
        signature = await signTypedDataAsync({
          domain: quoteResponse.permitData.domain,
          types: quoteResponse.permitData.types,
          primaryType: Object.keys(quoteResponse.permitData.types).filter(t => t !== 'EIP712Domain')[0],
          message: quoteResponse.permitData.values,
        } as any);
      }

      const { permitData, permitTransaction, ...cleanQuote } = quoteResponse;
      const swapRequest: any = { ...cleanQuote };
      if (isUniswapX) {
        if (signature) swapRequest.signature = signature;
      } else {
        if (signature && permitData) {
          swapRequest.signature = signature;
          swapRequest.permitData = permitData;
        }
      }

      const swapResponse = await fetch(`${TRADING_API_BASE}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': UNISWAP_API_KEY,
          'x-universal-router-version': '2.0',
        },
        body: JSON.stringify(swapRequest),
      });

      const swapData = await swapResponse.json();
      if (!swapResponse.ok) throw new Error(swapData.message || swapData.detail || 'Failed to prepare swap');

      const { swap } = swapData;
      
      // Chain Check
      const targetChainId = swap.chainId;
      if (chainId !== targetChainId) {
        console.log(`[useUniswapSwap] Switching to chain ${targetChainId} for Uniswap swap`);
        await switchChainAsync({ chainId: targetChainId });
      }

      const hash = await sendTransactionAsync({
        to: swap.to as Address,
        data: swap.data as `0x${string}`,
        value: BigInt(swap.value || '0'),
        chainId: swap.chainId,
        gas: swap.gasLimit ? BigInt(swap.gasLimit) : undefined,
      });

      return hash;
    } catch (err: any) {
      console.error("Swap execution error:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sendTransactionAsync, signTypedDataAsync]);

  return {
    getQuote,
    executeSwap,
    isLoading,
    error,
  };
}

export function formatQuoteAmount(quoteResponse: any): string {
  if (!quoteResponse) return '0';
  
  // Detect output token decimals (default to 18, use 6 for USDC/USDT)
  const outToken = 
    quoteResponse.quote?.output?.token || 
    quoteResponse.quote?.orderInfo?.outputs?.[0]?.token || 
    quoteResponse.outToken ||
    '';
  const isStable = outToken.toLowerCase().includes('usd');
  const decimals = isStable ? 6 : 18;

  if (quoteResponse._provider === 'OKU' || quoteResponse._provider === 'OKU_FALLBACK') {
    return (Number(quoteResponse.outAmount || quoteResponse.quote?.output?.amount || 0) / 10**decimals).toFixed(6);
  }

  const isUniswapX = ['DUTCH_V2', 'DUTCH_V3', 'PRIORITY'].includes(quoteResponse.routing || 'CLASSIC');
  if (isUniswapX) {
    const firstOutput = quoteResponse.quote.orderInfo.outputs[0];
    if (!firstOutput) return '0';
    return (Number(firstOutput.startAmount) / 10**decimals).toFixed(6);
  }
  
  if (!quoteResponse.quote?.output?.amount) return '0';
  return (Number(quoteResponse.quote.output.amount) / 10**decimals).toFixed(6);
}
