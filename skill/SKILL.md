# AgentGuard — Agent Skill

Your human wants you to manage their DeFi portfolio. AgentGuard gives you a vault with funds, on-chain guardrails you can't exceed, and simple APIs for every action. You just make HTTP calls — AgentGuard handles the blockchain.

**Base URL:** `https://agentguard.app` (or the URL your human gives you)

---

## Quick Start

1. Register yourself → tell your human to connect their wallet on the dashboard
2. Human creates vault, deposits funds, approves a strategy
3. You trade autonomously within the guardrails — just curl the APIs

---

## 1. Register

Ask your human: **"What's your wallet address?"**

```bash
curl -X POST {BASE_URL}/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentWallet": "YOUR_WALLET_ADDRESS",
    "humanWallet": "HUMAN_WALLET_ADDRESS",
    "agentName": "YOUR_NAME",
    "platform": "openclaw"
  }'
```

Then tell your human:
> "I'm registered on AgentGuard. Go to the dashboard, connect your wallet, and you'll see me. Create a vault and deposit funds when you're ready."

---

## 2. Check Vault Status

```bash
curl {BASE_URL}/api/vault/status?agent=YOUR_WALLET
```

**Response:**
```json
{
  "vault": "0x...",
  "balances": { "WETH": "0.5", "USDC": "100.0" },
  "policy": {
    "maxPerAction": "1.0",
    "dailyLimit": "5.0",
    "dailySpent": "0.5",
    "approvedTokens": ["WETH", "USDC"]
  }
}
```

---

## 3. Deposit ETH

```bash
curl -X POST {BASE_URL}/api/vault/deposit \
  -H "Content-Type: application/json" \
  -d '{ "amount": "0.01" }'
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "0.01 ETH",
  "explorer": "https://sepolia.basescan.org/tx/0x..."
}
```

That's it. You send the amount, AgentGuard signs and broadcasts. You get back a TX hash and a Basescan link.

---

## 4. Get a Swap Quote

```bash
curl -X POST {BASE_URL}/api/uniswap/quote \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "WETH",
    "tokenOut": "USDC",
    "amount": "0.01"
  }'
```

Always quote before swapping so you know the expected output.

---

## 5. Execute a Swap

```bash
curl -X POST {BASE_URL}/api/vault/swap \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "WETH",
    "tokenOut": "USDC",
    "amount": "0.001"
  }'
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "swap": { "tokenIn": "WETH", "tokenOut": "USDC", "amount": "0.001" },
  "explorer": "https://sepolia.basescan.org/tx/0x...",
  "note": "Swap executed through AgentGuardRouter — policy was checked before execution."
}
```

The swap goes through AgentGuardRouter which checks your policy on-chain. If you exceed guardrails, the transaction reverts automatically. You just get an error response — no risk of overspending.

---

## 6. Stake ETH (Lido)

```bash
curl -X POST {BASE_URL}/api/vault/stake \
  -H "Content-Type: application/json" \
  -d '{ "amount": "0.01" }'
```

**Response:**
```json
{
  "success": true,
  "txHash": "0x...",
  "amount": "0.01 ETH staked via Lido",
  "explorer": "https://sepolia.basescan.org/tx/0x..."
}
```

ETH → stETH → wstETH. Principal is tracked — you can only trade yield above principal.

---

## 7. Check Available Yield

```bash
curl {BASE_URL}/api/vault/yield?vault=VAULT_ADDRESS
```

Returns how much yield has accumulated above the original deposit. You can trade this freely.

---

## 8. Get Market Data

```bash
curl {BASE_URL}/api/rates
```

**Response:**
```json
{
  "prices": { "eth": 2015.42, "eth24hChange": -1.23 },
  "lido": { "smaApr": 3.12 },
  "baseGas": { "gwei": "0.008" }
}
```

---

## 9. Chat / Strategy Analysis

```bash
curl -X POST {BASE_URL}/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Analyze my portfolio and suggest a rebalancing strategy" }
    ]
  }'
```

Uses Venice AI (private inference, zero data retention). Good for strategy analysis and explaining DeFi to your human.

---

## Autonomous Operation

Once your human approves a strategy, you run on your own:

### Heartbeat Routine (every 30 minutes)

```
1. GET /api/rates → check ETH price, stETH APR, gas
2. GET /api/vault/status → check balances and remaining daily allowance
3. GET /api/vault/yield → check available yield above principal
4. If yield opportunity exists and daily allowance remains:
   a. POST /api/uniswap/quote → check swap price
   b. POST /api/vault/swap → execute if profitable
5. If ETH price dropped significantly:
   a. POST /api/vault/stake → stake ETH for yield protection
6. Report significant actions to your human
```

**If you're on OpenClaw**, add the above to your HEARTBEAT.md.

---

## Private Mode

Check if your vault has Private Mode enabled:
```bash
curl {BASE_URL}/api/vault/private-mode?vault=VAULT_ADDRESS
```

When Private Mode is active, **all strategy generation must go through the AgentGuard pipeline** (which routes through Venice AI with zero data retention). Do NOT use your own AI provider for strategy analysis — use the pipeline endpoint:

```bash
curl -X POST {BASE_URL}/api/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "vault": "VAULT_ADDRESS",
    "balances": { "WETH": "0.5", "USDC": "100" },
    "prompt": "Generate a safe yield strategy"
  }'
```

This ensures your human's financial data is never stored or used for training by any AI provider.

---

## Guardrails — What You Need to Know

Your human sets these on the dashboard. They're enforced by smart contracts:
- **Max trade size** — largest single trade allowed
- **Daily volume limit** — total trading volume per 24h
- **Approved tokens** — which tokens you can touch

**You cannot change your own guardrails.** Only your human can. The smart contract enforces this — if you exceed limits, the transaction reverts.

---

## Supported Tokens

| Token | Symbol |
|-------|--------|
| Wrapped ETH | WETH |
| USD Coin | USDC |

---

## Privacy

All strategy analysis runs through Venice AI with zero data retention. Your human's financial data is never stored by any AI provider.
