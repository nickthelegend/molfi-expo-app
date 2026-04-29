import { useState, useEffect } from 'react';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

const publicClient = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export function useENSResolution(ensName: string | null) {
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ensName || !ensName.includes('.')) {
      setAddress(null);
      return;
    }

    async function resolve() {
      setIsLoading(true);
      setError(null);
      try {
        const resolvedAddress = await publicClient.getEnsAddress({
          name: normalize(ensName as string),
        });
        setAddress(resolvedAddress);
      } catch (e: any) {
        console.error("ENS resolution failed:", e);
        setError(e.message);
        setAddress(null);
      } finally {
        setIsLoading(false);
      }
    }

    resolve();
  }, [ensName]);

  return { address, isLoading, error };
}
