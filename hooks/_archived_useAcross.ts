import { useState, useCallback } from 'react';
import { AcrossClient } from '@across-protocol/app-sdk';
import { useAccount, useSendTransaction, useSwitchChain, useWalletClient } from 'wagmi';
import { Address, parseUnits } from 'viem';
import { polygon } from 'viem/chains';

// Define 0G Chain Config if not already available
const zeroGChain = {
  id: 16661,
  name: '0G Mainnet',
  nativeCurrency: { name: 'A0GI', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.0g.ai'] },
    public: { http: ['https://rpc.0g.ai'] },
  },
};

const across = new AcrossClient({
  chains: [zeroGChain as any, polygon],
  integratorId: '0x1337', // Across requires a 2-byte hex string
});

export function useAcross() {
  const { address, chainId } = useAccount();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuote = useCallback(async (params: {
    fromChainId: number;
    toChainId: number;
    fromTokenAddress: string;
    toTokenAddress: string;
    amount: string; // raw amount as string
  }) => {
    setIsLoading(true);
    setError(null);
    console.log('[useAcross] Fetching quote:', params);
    try {
      const quote = await across.getQuote({
        fromChainId: params.fromChainId,
        toChainId: params.toChainId,
        fromTokenAddress: params.fromTokenAddress,
        toTokenAddress: params.toTokenAddress,
        amount: BigInt(params.amount).toString(), // Ensure absolute BigInt string
        recipient: address as Address,
      });
      
      console.log('[useAcross] Quote received:', quote);
      return quote;
    } catch (err: any) {
      console.error('[useAcross] Quote error:', err);
      setError(err.message || 'Failed to get Across quote');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const executeRoute = useCallback(async (quote: any) => {
    if (!walletClient) {
      setError("Wallet not connected");
      return null;
    }
    
    setIsLoading(true);
    setError(null);
    console.log('[useAcross] Building and sending transaction...');
    
    try {
      // Chain check
      if (chainId !== quote.fromChainId) {
        console.log(`[useAcross] Switching chain to ${quote.fromChainId}`);
        await switchChainAsync({ chainId: quote.fromChainId });
      }

      // Build transaction using Across SDK
      const tx = await across.buildTx(quote, { walletClient: walletClient as any });
      
      // Since we want to use Wagmi's sendTransaction for better UI integration with AppKit
      // We extract the transaction data
      const txData = await tx.getTxData();
      
      console.log('[useAcross] Broadcasting via Wagmi:', txData);
      
      const hash = await sendTransactionAsync({
        to: txData.to as Address,
        data: txData.data as `0x${string}`,
        value: txData.value ? BigInt(txData.value.toString()) : 0n,
        chainId: quote.fromChainId,
      });

      console.log('[useAcross] Transaction sent! Hash:', hash);
      return hash;
    } catch (err: any) {
      console.error('[useAcross] Execution error:', err);
      setError(err.message || 'Across bridge failed');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [chainId, walletClient, sendTransactionAsync, switchChainAsync]);

  return {
    getQuote,
    executeRoute,
    isLoading,
    error,
  };
}
