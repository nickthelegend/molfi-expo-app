const TRADING_API_BASE = 'https://trade-api.gateway.uniswap.org/v1';
const UNISWAP_API_KEY = 'VhS0REuDP3oJRt7kOcpB_LN_v0oyez8oerF2ogocHZU'; 

async function testQuote() {
  const response = await fetch(`${TRADING_API_BASE}/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': UNISWAP_API_KEY,
      'x-universal-router-version': '2.0',
    },
    body: JSON.stringify({
      swapper: '0x0000000000000000000000000000000000000000',
      tokenIn: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      tokenOut: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
      tokenInChainId: '16601',
      tokenOutChainId: '16601',
      amount: '1000000000000000000',
      type: 'EXACT_INPUT',
    }),
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

testQuote();
