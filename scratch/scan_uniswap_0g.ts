import { createPublicClient, http } from 'viem';
import { zeroGMainnet } from '@wagmi/core/chains';

const client = createPublicClient({
  chain: zeroGMainnet,
  transport: http()
});

async function findUniswap() {
  // Search common Uniswap v3 addresses
  const addresses = [
    '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Factory
    '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Router
    '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // Router02
    '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Universal Router
    '0x61fFe014b9F3d27457bd636222F361a7a28e85E0', // QuoterV2
  ];

  for (const addr of addresses) {
    const code = await client.getBytecode({ address: addr as any });
    console.log(`${addr}: ${code ? 'Exists' : 'None'}`);
  }
}

findUniswap();
