---
name: uniswap-v3-elite
description: Production-grade v1.0.0 elite guide to Uniswap V3 Swaps on Molfi. Use when the user wants to swap tokens on Base, Polygon, Arbitrum, or Ethereum.
---

# Uniswap V3 Elite Integration

This skill provides instructions for the Molfi agent to execute high-fidelity, production-ready swaps using Uniswap V3 protocols.

## Core Logic

Swaps in Molfi are performed via the `useSwap` hook which leverages Uniswap V3's `QuoterV2` for discovery and `SwapRouter` for execution.

### Supported Chains

| Chain    | ID    | Status      | Recommended Strategy |
| -------- | ----- | ----------- | -------------------- |
| Base     | 8453  | Operational | Low Fee, High Speed  |
| Polygon  | 137   | Operational | WMATIC/USDC focus    |
| Arbitrum | 42161 | Operational | Low Slippage         |
| Ethereum | 1     | Operational | Mainnet Liquidity    |

### Token Mapping (Native to Wrapped)

Uniswap V3 requires wrapped tokens (WETH, WMATIC) for contract interactions. Molfi automatically handles the mapping of native addresses (`0xeeee...`) to wrapped versions.

| Symbol | Base (8453) | Polygon (137) | Ethereum (1) |
| ------ | ----------- | ------------- | ------------ |
| ETH    | 0x4200...06 | 0x0d50...70   | 0xC02a...c2  |
| MATIC  | N/A         | 0x0d50...70   | N/A          |

## Agent Workflow for Swaps

When a user expresses intent to swap (e.g., "Swap 0.1 ETH for USDC on Base"), the agent must:

1. **Verify Parameters**: Ensure `fromChain`, `symbolIn`, `symbolOut`, and `amount` are clear.
2. **Resolve Addresses**: Use `FALLBACK_ADDRESSES` for common tokens or perform a web search for new tokens.
3. **Generate Intent**: Respond with a structured `SWAP` intent payload.

### Intent Payload Structure

```json
{
  "type": "SWAP",
  "reasoning": "Optimizing asset allocation by converting ETH to stablecoins on Base to take advantage of low fees.",
  "plan": {
    "intent": "Swap ETH for USDC",
    "steps": [
      {
        "action": "swap",
        "params": {
          "chainId": 8453,
          "symbolIn": "ETH",
          "symbolOut": "USDC",
          "amount": "0.1",
          "tokenInDecimals": 18,
          "tokenOutDecimals": 6
        }
      }
    ]
  }
}
```

## Best Practices

1. **Slippage**: Default is 0.5% (50 bps). For volatile tokens, warn the user.
2. **Liquidity**: If a "No liquidity" error occurs, it usually means the token address is incorrect or the amount is too small for the pool's fee tiers.
3. **Decimals**: Always verify decimals. Standard: ETH (18), USDC (6), USDT (6), WBTC (8).

## Error Troubleshooting

- **"No liquidity found for this pair"**: Ensure the `tokenIn` address matches the selected `chainId`.
- **"value.split is not a function"**: Ensure the `amount` is passed as a string in the payload.
- **"Chain not supported"**: Molfi currently supports 1, 137, 8453, and 42161.
