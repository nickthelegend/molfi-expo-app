import { useState, useCallback } from 'react';
import { useAccount, useSendTransaction, useSignTypedData } from 'wagmi';
import { Address, parseUnits } from 'viem';

const TRADING_API_BASE = 'https://trade-api.gateway.uniswap.org/v1';

// Replace with your actual API key from developers.uniswap.org
const UNISWAP_API_KEY = 'YOUR_API_KEY'; 

export function useUniswapSwap() {
  const { address } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { signTypedDataAsync } = useSignTypedData();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (params: {
    tokenIn: string;
    tokenOut: string;
    amount: string;
    chainId: number;
    type?: 'EXACT_INPUT' | 'EXACT_OUTPUT';
  }) => {
    setIsLoading(true);
    setError(null);
    try {
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
      if (!response.ok) throw new Error(data.message || 'Failed to get quote');
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
      // 1. Get swap transaction from API
      const { permitData, permitTransaction, ...cleanQuote } = quoteResponse;
      
      const swapResponse = await fetch(`${TRADING_API_BASE}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': UNISWAP_API_KEY,
          'x-universal-router-version': '2.0',
        },
        body: JSON.stringify({
          ...cleanQuote,
          // signature will be added here if using Permit2
        }),
      });

      const swapData = await swapResponse.json();
      if (!swapResponse.ok) throw new Error(swapData.message || 'Failed to prepare swap');

      const { swap } = swapData;

      // 2. Send transaction
      const hash = await sendTransactionAsync({
        to: swap.to as Address,
        data: swap.data as `0x${string}`,
        value: BigInt(swap.value || '0'),
        chainId: swap.chainId,
      });

      return hash;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sendTransactionAsync]);

  return {
    getQuote,
    executeSwap,
    isLoading,
    error,
  };
}
