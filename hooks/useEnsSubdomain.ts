import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { namehash, labelhash, getAddress } from 'viem';
import { useState, useCallback } from 'react';

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

  /**
   * Check if a subdomain is available.
   * available if no owner is found.
   */
  const checkAvailability = useCallback(async (fullDomain: string): Promise<boolean> => {
    if (!publicClient) return false;
    try {
      const owner = await publicClient.getEnsAddress({ name: fullDomain });
      return owner === null || owner === '0x0000000000000000000000000000000000000000';
    } catch (error) {
      console.error('[useEnsSubdomain] Availability check failed:', error);
      return false;
    }
  }, [publicClient]);

  /**
   * Fetch price for registration.
   * For personal ENS subdomains, this is usually 0 (gas only).
   */
  const fetchPrice = useCallback(async (fullDomain: string, durationYears: number): Promise<string> => {
    // Standard ENS subnodes created via setSubnodeOwner don't have a protocol-level fee
    return '0';
  }, []);

  /**
   * Register a subdomain on-chain.
   * Sets the agent's wallet address as the owner of the subdomain node.
   */
  const registerSubdomain = useCallback(async (
    fullDomain: string,
    agentWalletAddress: string,
    durationYears: number
  ): Promise<{ txHash: string; success: boolean }> => {
    if (!walletClient || !publicClient || !userAddress) {
      throw new Error('Wallet not connected or client not initialized');
    }

    try {
      const parts = fullDomain.split('.');
      const label = parts[0];
      const parentDomain = parts.slice(1).join('.');
      
      const parentNode = namehash(parentDomain);
      const labelHash = labelhash(label);

      console.log(`[useEnsSubdomain] Registering ${fullDomain} to ${agentWalletAddress}`);

      const hash = await walletClient.writeContract({
        address: ENS_REGISTRY_ADDRESS,
        abi: ENS_REGISTRY_ABI,
        functionName: 'setSubnodeOwner',
        args: [parentNode, labelHash, getAddress(agentWalletAddress)],
        account: userAddress,
      });

      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return { 
        txHash: hash, 
        success: receipt.status === 'success' 
      };
    } catch (error: any) {
      console.error('[useEnsSubdomain] Registration failed:', error);
      throw error;
    }
  }, [walletClient, publicClient, userAddress]);

  return { checkAvailability, fetchPrice, registerSubdomain };
}
