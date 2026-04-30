
const FALLBACK_ADDRESSES: Record<string, Record<string, string>> = {
  '16661': {
    'USDC': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Example
  }
};

function resolveAddress(params: any) {
    const fromChain = params.fromChain || params.chainId;
    // Current bug: "null" is truthy, so it returns "null" instead of looking up the fallback
    const fromTokenAddr = params.tokenIn || FALLBACK_ADDRESSES[String(fromChain)]?.[params.symbolIn?.toUpperCase()];
    return fromTokenAddr;
}

const paramsWithBug = {
    tokenIn: "null",
    symbolIn: "USDC",
    fromChain: 16661
};

console.log("Resolved Address (with bug):", resolveAddress(paramsWithBug));

function resolveAddressFixed(params: any) {
    const fromChain = params.fromChain || params.chainId;
    // Fix: Treat "null" string as missing
    const tokenIn = (params.tokenIn === "null" || !params.tokenIn) ? null : params.tokenIn;
    const fromTokenAddr = tokenIn || FALLBACK_ADDRESSES[String(fromChain)]?.[params.symbolIn?.toUpperCase()];
    return fromTokenAddr;
}

console.log("Resolved Address (fixed):", resolveAddressFixed(paramsWithBug));
