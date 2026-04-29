import { createPublicClient, http } from 'viem';
import { zeroGMainnet } from '@wagmi/core/chains';

const client = createPublicClient({
  chain: zeroGMainnet,
  transport: http()
});

const UNIVERSAL_ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';

async function checkRouter() {
  try {
    const code = await client.getBytecode({ address: UNIVERSAL_ROUTER as any });
    console.log(`Router code at ${UNIVERSAL_ROUTER}: ${code ? 'Exists' : 'None'}`);
  } catch (e: any) {
    console.error(`Error: ${e.message}`);
  }
}

checkRouter();
