import { defineChain } from 'viem';

// ─── 0G Chain Definition ───────────────────────────────────────────────────
export const ogChain = defineChain({
  id: 16601,
  name: '0G Mainnet',
  nativeCurrency: { name: 'A0GI', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc.0g.ai'] },
    public: { http: ['https://evmrpc.0g.ai'] },
  },
  blockExplorers: {
    default: { name: '0G Explorer', url: 'https://chainscan.0g.ai' },
  },
});

// Official Uniswap V3 Contracts (Ethereum, Polygon, Arbitrum, Base, Optimism)
export const UNISWAP_V3_CONTRACTS = {
  SWAP_ROUTER: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45' as `0x${string}`,
  QUOTER_V2:   '0x61fFE014bA17989E743c5F6cB21bF9697530B21e' as `0x${string}`,
  FACTORY:     '0x1F98431c8aD98523631AE4a59f267346ea31F984' as `0x${string}`,
} as const;

export const POLYGON_CONTRACTS = {
  ...UNISWAP_V3_CONTRACTS,
  WETH:         '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270' as `0x${string}`, // WMATIC
  USDC:         '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as `0x${string}`,
} as const;

// ─── Common token fee tiers (Uniswap V3 standard) ─────────────────────────
// LOWEST=100, LOW=500, MEDIUM=3000, HIGH=10000
export const FEE_TIERS = { LOWEST: 100, LOW: 500, MEDIUM: 3000, HIGH: 10000 } as const;

// ─── Minimal ABIs — no package imports, inline only ──────────────────────

export const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    name: 'allowance',
    type: 'function',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    name: 'decimals',
    type: 'function',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    name: 'balanceOf',
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export const QUOTER_V2_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'tokenIn',           type: 'address' },
        { name: 'tokenOut',          type: 'address' },
        { name: 'amountIn',          type: 'uint256' },
        { name: 'fee',               type: 'uint24'  },
        { name: 'sqrtPriceLimitX96', type: 'uint160' },
      ],
    }],
    outputs: [
      { name: 'amountOut',                type: 'uint256' },
      { name: 'sqrtPriceX96After',        type: 'uint160' },
      { name: 'initializedTicksCrossed',  type: 'uint32'  },
      { name: 'gasEstimate',              type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
] as const;

export const SWAP_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'tokenIn',           type: 'address' },
        { name: 'tokenOut',          type: 'address' },
        { name: 'fee',               type: 'uint24'  },
        { name: 'recipient',         type: 'address' },
        { name: 'deadline',          type: 'uint256' },
        { name: 'amountIn',          type: 'uint256' },
        { name: 'amountOutMinimum',  type: 'uint256' },
        { name: 'sqrtPriceLimitX96', type: 'uint160' },
      ],
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
  },
] as const;
