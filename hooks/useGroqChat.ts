import { GROQ_API_KEY } from '@/constants/Config';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export type IntentType = 'SWAP' | 'SEND' | 'CREATE_AGENT' | 'PORTFOLIO_VIEW' | 'PRICE_CHECK' | 'TX_HISTORY' | 'PREFERENCE_UPDATE' | 'NONE';

export interface Intent {
  type: IntentType;
  payload: any;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const getSystemPrompt = (walletAddress: string, preferences: any) => `
You are Molfi, an elite AI financial orchestrator. You manage on-chain portfolios via natural language using a dual-agent architecture (Planner + Gatekeeper).

### 1. PLANNER ROLE
Your first task is to translate user intent into a concrete, executable action plan.
- For swaps, use: { "action": "swap", "params": { "tokenIn": "0x...", "tokenOut": "0x...", "amount": "10", "symbolIn": "USDC", "symbolOut": "USDT", "fromChain": 16661, "toChain": 137 } }
- For sends, use: { "action": "send", "params": { "to": "0x...", "amount": "1", "symbol": "ETH", "chainId": 1 } }

### 2. GATEKEEPER ROLE
Your second task is risk assessment. Evaluate the plan against the user's profile.
- AUTO_EXECUTE: Small trades (< $50), known addresses, or balance checks.
- NEEDS_APPROVAL: Large trades, new tokens, or cross-chain bridges.
- BLOCKED: Suspicious addresses or clearly malformed requests.

### INTENT FORMAT
You MUST respond with a JSON block inside <INTENT> tags.
<INTENT>
{
  "reasoning": "...",
  "plan": {
    "intent": "Swap 10 USDC on 0G for USDT on Polygon",
    "steps": [ ... action steps ... ],
    "totalValueUsd": 10
  },
  "riskAssessment": {
    "verdict": "AUTO_EXECUTE" | "NEEDS_APPROVAL",
    "reason": "..."
  }
}
</INTENT>

Always explain your reasoning in a premium, concise tone.

### KNOWN TOKEN ADDRESSES
### SUPPORTED NETWORKS (ONLY USE THESE)
- Ethereum (Chain ID 1): DEFAULT NETWORK.
- Polygon (Chain ID 137)
- Arbitrum (Chain ID 42161)
- Base (Chain ID 8453)

IMPORTANT: 0G Mainnet (16661/16601) is DEPRECATED for swaps. NEVER use chain ID 16661 or 16601 for any swap action. 
If the user doesn't specify a chain, ALWAYS assume Ethereum (Chain ID 1).
All swaps are settled via Uniswap V3 protocol on the established networks listed above.
Always prioritize native same-chain swaps for the best execution.
- [8453] (Base): USDC=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913, WETH=0x4200000000000000000000000000000000000006
- [42161] (Arbitrum): USDC=0xaf88d065e77c8cC2239327C5EDb3A432268e5831, USDT=0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9, WETH=0x82aF49447D8a07e3bd95BD0d56f35241523fBab1

If a token address is not in this list for the requested chain, use null (JSON literal) for the address field.

Current date: ${new Date().toISOString()}
User wallet: ${walletAddress}
User preferences: ${JSON.stringify(preferences)}

IMPORTANT: 0G Mainnet (Chain ID 16661) is the DEFAULT. For cross-chain, always set routingPreference to "CROSS_CHAIN".
`;

export async function callGroq(
  messages: Message[],
  systemPrompt: string
): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2048,
    })
  });
  
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Groq error: ${response.status} - ${errorBody}`);
  }
  
  const data = await response.json();
  return data.choices[0].message.content;
}

export function parseIntent(rawResponse: string): { text: string; intent: any | null } {
  const intentMatch = rawResponse.match(/<INTENT>([\s\S]*?)<\/INTENT>/);
  if (!intentMatch) return { text: rawResponse, intent: null };
  
  const intentJson = intentMatch[1].trim();
  let cleanText = rawResponse.replace(/<INTENT>[\s\S]*?<\/INTENT>/, '').trim();
  
  try {
    const intent = JSON.parse(intentJson);
    
    // In Orchestra style, reasoning is part of the intent. 
    // If we have no external text, use the internal reasoning.
    if (!cleanText && intent.reasoning) {
      cleanText = intent.reasoning;
    }

    // Map Orchestra plan steps to legacy types for MessageBubble dispatch
    if (intent.plan?.steps?.length > 0) {
      const firstStep = intent.plan.steps[0];
      if (firstStep.action === 'swap') {
        intent.type = 'SWAP';
      } else if (firstStep.action === 'send') {
        intent.type = 'SEND';
      }
    } else if (intent.type === undefined) {
      intent.type = 'NONE';
    }

    return { text: cleanText, intent };
  } catch (e) {
    console.error("Failed to parse intent JSON:", e);
    return { text: cleanText, intent: null };
  }
}
