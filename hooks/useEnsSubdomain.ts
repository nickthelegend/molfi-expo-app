import { usePublicClient, useAccount as useWagmiAccount } from 'wagmi';
import { useAccount, useProvider } from '@reown/appkit-react-native';
import { namehash, labelhash, getAddress, createWalletClient, custom } from 'viem';
import { useState, useCallback, useRef, useEffect } from 'react';
import { mainnet } from 'viem/chains';

const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

const ENS_REGISTRY_ABI = [
  {
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'bytes32' },
      { name: 'owner', type: 'address' },
    ],
    name: 'setSubnodeOwner',
    outputs: [{ name: 'node', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function useEnsSubdomain() {
  const publicClient = usePublicClient();
  const { address } = useAccount();
  const { provider: walletProvider } = useProvider();

  const publicClientRef = useRef(publicClient);
  const addressRef = useRef(address);
  const providerRef = useRef(walletProvider);

  useEffect(() => { publicClientRef.current = publicClient; }, [publicClient]);
  useEffect(() => { addressRef.current = address; }, [address]);
  useEffect(() => { providerRef.current = walletProvider; }, [walletProvider]);

  /**
   * Check if a subdomain is available.
   */
  const checkAvailability = useCallback(async (fullDomain: string): Promise<boolean> => {
    const pc = publicClientRef.current;
    if (!pc) return false;
    try {
      const owner = await pc.getEnsAddress({ name: fullDomain });
      return owner === null || owner === '0x0000000000000000000000000000000000000000';
    } catch (error) {
      console.error('[useEnsSubdomain] Availability check failed:', error);
      return false;
    }
  }, []);

  /**
   * Fetch price for registration (Mocked for now).
   */
  const fetchPrice = useCallback(async (fullDomain: string, durationYears: number): Promise<string> => {
    return '0';
  }, []);

  /**
   * Register a subdomain on-chain using the AppKit Provider directly.
   */
  const registerSubdomain = useCallback(async (
    fullDomain: string,
    agentWalletAddress: string,
    durationYears: number
  ): Promise<{ txHash: string; success: boolean }> => {
    const pc = publicClientRef.current;
    const provider = providerRef.current;
    const userAddress = addressRef.current;

    if (!provider || !pc || !userAddress) {
      console.error('[useEnsSubdomain] AppKit components not ready:', { provider: !!provider, pc: !!pc, userAddress: !!userAddress });
      throw new Error('Wallet not connected or provider not initialized');
    }

    try {
      // ── Pre-check: Ensure wallet is on Ethereum Mainnet (Chain ID 1) ──
      try {
        console.log('[useEnsSubdomain] Requesting chain switch to Ethereum Mainnet...');
        await (provider as any).request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }],
        });
        console.log('[useEnsSubdomain] Chain switch successful or already on Mainnet.');
      } catch (e: any) {
        console.warn('[useEnsSubdomain] Chain switch warning (continuing anyway):', e.message);
      }

      const parts = fullDomain.split('.');
      const label = parts[0];
      const parentDomain = parts.slice(1).join('.');
      
      const parentNode = namehash(parentDomain);
      const labelHash = labelhash(label);

      // Create a direct wallet client from the AppKit provider
      const walletClient = createWalletClient({
        chain: mainnet,
        transport: custom(provider as any),
        account: userAddress as `0x${string}`,
      });

      console.log('[useEnsSubdomain] Sending direct setSubnodeOwner transaction via AppKit provider...');

      const hash = await walletClient.writeContract({
        address: ENS_REGISTRY_ADDRESS,
        abi: ENS_REGISTRY_ABI,
        functionName: 'setSubnodeOwner',
        args: [parentNode, labelHash, getAddress(agentWalletAddress)],
      });

      console.log('[useEnsSubdomain] Transaction sent! Hash:', hash);

      const receipt = await pc.waitForTransactionReceipt({ hash });
      return { 
        txHash: hash, 
        success: receipt.status === 'success' 
      };
    } catch (error: any) {
      console.error('[useEnsSubdomain] Registration failed:', error);
      throw error;
    }
  }, []);

  return { checkAvailability, fetchPrice, registerSubdomain };
}
