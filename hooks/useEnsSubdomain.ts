import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { namehash, labelhash, getAddress } from 'viem';
import { useState, useCallback, useRef, useEffect } from 'react';

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
  const { data: walletClient } = useWalletClient();
  const { address: userAddress } = useAccount();

  const publicClientRef = useRef(publicClient);
  const walletClientRef = useRef(walletClient);
  const userAddressRef = useRef(userAddress);

  useEffect(() => { publicClientRef.current = publicClient; }, [publicClient]);
  useEffect(() => { walletClientRef.current = walletClient; }, [walletClient]);
  useEffect(() => { userAddressRef.current = userAddress; }, [userAddress]);

  /**
   * Check if a subdomain is available.
   */
  const checkAvailability = useCallback(async (fullDomain: string): Promise<boolean> => {
    const pc = publicClientRef.current;
    if (!pc) {
      console.warn('[useEnsSubdomain] publicClient not ready');
      return false;
    }
    try {
      const owner = await pc.getEnsAddress({ name: fullDomain });
      return owner === null || owner === '0x0000000000000000000000000000000000000000';
    } catch (error) {
      console.error('[useEnsSubdomain] Availability check failed:', error);
      return false;
    }
  }, []);

  /**
   * Fetch price for registration.
   */
  const fetchPrice = useCallback(async (fullDomain: string, durationYears: number): Promise<string> => {
    return '0';
  }, []);

  /**
   * Register a subdomain on-chain.
   */
  const registerSubdomain = useCallback(async (
    fullDomain: string,
    agentWalletAddress: string,
    durationYears: number
  ): Promise<{ txHash: string; success: boolean }> => {
    const pc = publicClientRef.current;
    const wc = walletClientRef.current;
    const ua = userAddressRef.current;

    if (!wc || !pc || !ua) {
      throw new Error('Wallet not connected or client not initialized');
    }

    try {
      const parts = fullDomain.split('.');
      const label = parts[0];
      const parentDomain = parts.slice(1).join('.');
      
      const parentNode = namehash(parentDomain);
      const labelHash = labelhash(label);

      const hash = await wc.writeContract({
        address: ENS_REGISTRY_ADDRESS,
        abi: ENS_REGISTRY_ABI,
        functionName: 'setSubnodeOwner',
        args: [parentNode, labelHash, getAddress(agentWalletAddress)],
        account: ua,
      });

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
