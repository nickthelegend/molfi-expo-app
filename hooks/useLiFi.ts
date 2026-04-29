import { useState, useCallback } from 'react';
import { useAccount, useSendTransaction, useSwitchChain, useWalletClient } from 'wagmi';
import { Address } from 'viem';

// Lazy load LiFi to ensure polyfills are applied first
let lifiInstance: any = null;
const getLiFi = () => {
  if (!lifiInstance) {
    const { LiFi } = require('@lifi/sdk');
    lifiInstance = new LiFi({ integrator: 'molfi-app' });
  }
  return lifiInstance;
};

export function useLiFi() {
  const { address, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (params: RoutesRequest) => {
    setIsLoading(true);
    setError(null);
    console.log('[useLiFi] Fetching quote with params:', JSON.stringify(params, null, 2));
    try {
      const lifi = getLiFi();
      const result = await lifi.getRoutes(params);
      if (!result.routes || result.routes.length === 0) {
        console.error('[useLiFi] No routes found');
        throw new Error('No routes found for this swap/bridge');
      }
      console.log(`[useLiFi] Found ${result.routes.length} routes. Picking best:`, result.routes[0].id);
      return result.routes[0];
    } catch (err: any) {
      console.error('[useLiFi] Quote error:', err);
      setError(err.message || 'Failed to get bridge quote');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const executeRoute = useCallback(async (route: Route) => {
    setIsLoading(true);
    setError(null);
    console.log('[useLiFi] Executing route:', route.id, 'Tool:', route.steps[0].tool);
    try {
      // Chain Check
      const startChainId = route.fromChainId;
      if (chainId !== startChainId) {
        console.log(`[useLiFi] Chain mismatch. Current: ${chainId}, Target: ${startChainId}. Switching...`);
        await switchChainAsync({ chainId: startChainId });
      }

      const step = route.steps[0];
      console.log('[useLiFi] Fetching transaction data for step 0...');
      const lifi = getLiFi();
      const transactionRequest = await lifi.getStepTransaction(step);
      
      const { transactionRequest: tx } = transactionRequest;
      if (!tx) {
        console.error('[useLiFi] Step transaction data is missing');
        throw new Error('Failed to get transaction data from LiFi');
      }

      console.log('[useLiFi] Broadcasting transaction via Wagmi:', {
        to: tx.to,
        value: tx.value?.toString(),
        dataLength: tx.data?.length
      });
      
      const hash = await sendTransactionAsync({
        to: tx.to as Address,
        data: tx.data as `0x${string}`,
        value: tx.value ? BigInt(tx.value.toString()) : 0n,
        chainId: startChainId,
      });

      console.log('[useLiFi] Transaction successful! Hash:', hash);
      return hash;
    } catch (err: any) {
      console.error('[useLiFi] Execution error:', err);
      setError(err.message || 'Bridge execution failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [chainId, sendTransactionAsync, switchChainAsync]);

  return {
    getQuote,
    executeRoute,
    isLoading,
    error,
  };
}
