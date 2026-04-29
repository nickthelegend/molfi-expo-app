import { useState, useCallback } from 'react';
import { useAccount as useAppKitAccount } from '@reown/appkit-react-native';
import { useSendTransaction, useSignTypedData } from 'wagmi';
import { Address, parseUnits, isAddress, isHex } from 'viem';

const TRADING_API_BASE = 'https://trade-api.gateway.uniswap.org/v1';
const UNISWAP_API_KEY = 'VhS0REuDP3oJRt7kOcpB_LN_v0oyez8oerF2ogocHZU'; 

const SUPPORTED_CHAINS = [1, 10, 56, 137, 8453, 42161, 43114, 11155111, 11155420];

export type QuoteParams = {
  tokenIn: string;
  tokenOut: string;
  amount: string;
  chainId: number;
  type?: 'EXACT_INPUT' | 'EXACT_OUTPUT';
};

export function useUniswapSwap() {
  const { address } = useAppKitAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { signTypedDataAsync } = useSignTypedData();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (params: QuoteParams) => {
    if (!SUPPORTED_CHAINS.includes(params.chainId)) {
      setError(`Chain ${params.chainId} is not supported by Uniswap API`);
      return null;
    }
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
      const isUniswapX = ['DUTCH_V2', 'DUTCH_V3', 'PRIORITY'].includes(quoteResponse.routing);
      let signature: string | undefined;

      // 1. Handle Permit2 Signing if needed
      if (quoteResponse.permitData) {
        signature = await signTypedDataAsync({
          domain: quoteResponse.permitData.domain,
          types: quoteResponse.permitData.types,
          primaryType: Object.keys(quoteResponse.permitData.types).filter(t => t !== 'EIP712Domain')[0],
          message: quoteResponse.permitData.values,
        } as any);
      }

      // 2. Prepare Swap Request
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
      if (!swapResponse.ok) throw new Error(swapData.message || 'Failed to prepare swap');

      const { swap } = swapData;

      // 3. Send transaction
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

export function formatQuoteAmount(quoteResponse: any, decimals: number = 18): string {
  if (!quoteResponse) return '0';
  
  const isUniswapX = ['DUTCH_V2', 'DUTCH_V3', 'PRIORITY'].includes(quoteResponse.routing);
  
  if (isUniswapX) {
    const firstOutput = quoteResponse.quote.orderInfo.outputs[0];
    if (!firstOutput) return '0';
    return (Number(firstOutput.startAmount) / 10**decimals).toFixed(6);
  }
  
  if (!quoteResponse.quote?.output?.amount) return '0';
  return (Number(quoteResponse.quote.output.amount) / 10**decimals).toFixed(6);
}
