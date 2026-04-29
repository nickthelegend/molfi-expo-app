async function debugOkuMarket() {
  console.log("--- Debugging Oku Market API ---");
  
  const urls = [
    'https://api.v2.oku.trade/v1/market/quote?chain=0g&tokenIn=ETH&tokenOut=USDC&amount=1000000000000000000',
    'https://api.v2.oku.trade/v1/quote?chain=0g&tokenIn=ETH&tokenOut=USDC&amount=1000000000000000000',
    'https://api.oku.trade/v1/market/quote?chain=0g&tokenIn=ETH&tokenOut=USDC&amount=1000000000000000000'
  ];
  
  for (const url of urls) {
    console.log(`\nURL: ${url}`);
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      });
      console.log(`Status: ${res.status}`);
      const data = await res.json();
      console.log(`Data: ${JSON.stringify(data).slice(0, 200)}...`);
    } catch (e: any) {
      console.error(`Error: ${e.message}`);
    }
  }
}

debugOkuMarket();
