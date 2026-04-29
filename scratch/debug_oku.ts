const OKU_API_BASE_V2 = 'https://api.v2.oku.trade/v1';
const OKU_API_BASE_V1 = 'https://api.oku.trade/v1';

async function debugOku() {
  console.log("--- Debugging Oku Trade API ---");
  
  const chains = ['0g', '0g_galileo', 'base', 'ethereum'];
  
  for (const chain of chains) {
    console.log(`\nTesting chain: ${chain}`);
    try {
      const url = `${OKU_API_BASE_V2}/quote?chain=${chain}&tokenIn=ETH&tokenOut=USDC&amount=1000000000000000000`;
      console.log(`URL: ${url}`);
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      const data = await res.json();
      console.log(`Data: ${JSON.stringify(data).slice(0, 200)}...`);
    } catch (e: any) {
      console.error(`Error with V2: ${e.message}`);
    }

    try {
      const url = `${OKU_API_BASE_V1}/quote?chain=${chain}&tokenIn=ETH&tokenOut=USDC&amount=1000000000000000000`;
      console.log(`URL: ${url}`);
      const res = await fetch(url);
      console.log(`Status: ${res.status}`);
      const data = await res.json();
      console.log(`Data: ${JSON.stringify(data).slice(0, 200)}...`);
    } catch (e: any) {
      console.error(`Error with V1: ${e.message}`);
    }
  }
}

debugOku();
