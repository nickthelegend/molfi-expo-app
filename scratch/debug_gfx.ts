const GFX_API_BASE = 'https://api.gfx.xyz/v1';

async function debugGfx() {
  console.log("--- Debugging GFX API (Oku) ---");
  
  const chains = ['0g', '0g_galileo'];
  
  for (const chain of chains) {
    console.log(`\nTesting chain: ${chain}`);
    try {
      const url = `${GFX_API_BASE}/quote?chain=${chain}&tokenIn=ETH&tokenOut=USDC&amount=1000000000000000000`;
      console.log(`URL: ${url}`);
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      const data = await res.json();
      console.log(`Data: ${JSON.stringify(data).slice(0, 200)}...`);
    } catch (e: any) {
      console.error(`Error with GFX: ${e.message}`);
    }
  }
}

debugGfx();
