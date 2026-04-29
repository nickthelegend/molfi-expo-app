import { createPublicClient, http } from 'viem';
import { zeroGMainnet } from '@wagmi/core/chains';

const client = createPublicClient({
  chain: zeroGMainnet,
  transport: http()
});

const UNISWAP_V3_FACTORY = '0x1F98431c8aD98523631AE4a59f267346ea31F984';

async function checkFactory() {
  try {
    const code = await client.getBytecode({ address: UNISWAP_V3_FACTORY as any });
    console.log(`Factory code at ${UNISWAP_V3_FACTORY}: ${code ? 'Exists' : 'None'}`);
  } catch (e: any) {
    console.error(`Error: ${e.message}`);
  }
}

checkFactory();
