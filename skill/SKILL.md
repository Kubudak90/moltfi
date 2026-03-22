# AgentGuard — DeFi Agent Skill

AgentGuard is your DeFi financial advisor. Your human wants to put their crypto to work but doesn't know DeFi — that's where you come in. You talk to AgentGuard's DeFi agent on their behalf, get strategy advice, and execute trades within on-chain guardrails their human set.

**Think of it like this:** You're your human's personal assistant. AgentGuard is the financial advisor you consult. You check in periodically, ask for advice, and execute what makes sense — all within limits your human approved.

**Base URL:** `https://agentguard.app` (or the URL your human gives you)

---

## How It Works

1. Your human connects their wallet on the AgentGuard dashboard
2. They send you this skill — you learn how to talk to the DeFi agent
3. You register yourself with your human's wallet
4. Your human creates a vault and deposits funds
5. Your human picks a strategy on the dashboard — guardrails go on-chain
6. **You check in with the DeFi agent on your heartbeat** — it tells you if action is needed
7. You execute trades through the vault — the blockchain enforces the guardrails

Your human never has to know DeFi. You handle everything through the advisor.

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

---

## 2. Check In With the DeFi Advisor

This is your main interaction. Call this on your heartbeat or whenever your human asks about their portfolio:

```bash
# 1. Get market conditions
curl {BASE_URL}/api/rates

# 2. Get vault status (balances + remaining daily allowance)
curl {BASE_URL}/api/vault/status?vault=VAULT_ADDRESS

# 3. Ask the advisor for analysis
curl -X POST {BASE_URL}/api/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "vault": "VAULT_ADDRESS",
    "balances": { "WETH": "0.5", "USDC": "100" },
    "prompt": "Should I rebalance? Any yield opportunities? Current ETH price is $2100, Lido APR is 3.1%"
  }'
```

The advisor uses Venice AI (private inference, zero data retention) to analyze conditions and give you a recommendation. If it says trade — you execute through the vault.

---

## 3. Execute a Trade

When the advisor recommends a swap:

```bash
# Quote first
curl -X POST {BASE_URL}/api/uniswap/quote \
  -H "Content-Type: application/json" \
  -d '{ "tokenIn": "WETH", "tokenOut": "USDC", "amount": "0.01" }'

# Execute
curl -X POST {BASE_URL}/api/vault/swap \
  -H "Content-Type: application/json" \
  -d '{ "tokenIn": "WETH", "tokenOut": "USDC", "amount": "0.001" }'
```

The swap goes through AgentGuardRouter which checks your policy on-chain. If you exceed guardrails, the transaction reverts automatically — no risk of overspending.

---

## 4. Stake ETH (Lido)

```bash
curl -X POST {BASE_URL}/api/vault/stake \
  -H "Content-Type: application/json" \
  -d '{ "amount": "0.01" }'
```

ETH → stETH → wstETH. Principal is tracked — you can only trade yield above the original deposit.

---

## 5. Other Endpoints

```bash
# Deposit ETH into vault
curl -X POST {BASE_URL}/api/vault/deposit \
  -H "Content-Type: application/json" \
  -d '{ "amount": "0.01" }'

# Check available yield above principal
curl {BASE_URL}/api/vault/yield?vault=VAULT_ADDRESS

# Check vault activity (trade history)
curl {BASE_URL}/api/vault/activity?vault=VAULT_ADDRESS

# Check private mode status
curl {BASE_URL}/api/vault/private-mode?vault=VAULT_ADDRESS
```

---

## Add to Your Heartbeat

Update your HEARTBEAT.md (or equivalent periodic check) to include AgentGuard:

```
- **AgentGuard:** Check in with DeFi advisor — GET /api/rates + GET /api/vault/status.
  If market conditions changed or yield opportunity exists, consult POST /api/pipeline for advice.
  Execute trades if recommended and within daily allowance.
  Report significant actions to human.
```

That's it. You don't need to understand DeFi — the advisor does. You just relay information between your human and the advisor, and execute what the advisor recommends within the guardrails.

---

## When Your Human Asks Questions

If your human asks about their portfolio, DeFi strategies, or what the agent is doing — use the chat endpoint to consult the advisor:

```bash
curl -X POST {BASE_URL}/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "My human wants to know: is staking a good idea right now?" }
    ]
  }'
```

Translate the response into plain language for your human. They don't need to see APRs and gas prices — they need to know "yes, your money is growing" or "the market dipped, the agent paused trading to protect your funds."

---

## Guardrails

Your human sets these on the dashboard. They're enforced by smart contracts — not by you, not by us:

- **Max trade size** — largest single trade allowed
- **Daily volume limit** — total trading volume per 24h
- **Approved tokens** — which tokens you can touch (WETH, USDC)

**You cannot change your own guardrails.** Only your human can. If you exceed limits, the blockchain reverts the transaction automatically.

---

## Privacy

All strategy analysis runs through Venice AI with zero data retention. Your human's financial data is never stored by any AI provider. When Private Mode is enabled on the dashboard, all inference is forced through Venice — no exceptions.
