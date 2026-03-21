# AgentGuard — Agent Skill

Your human wants you to manage their DeFi portfolio. AgentGuard gives you a vault with funds, on-chain guardrails you can't exceed, and APIs for every action. This skill teaches you everything.

**Base URL:** `https://agentguard.app` (or the URL your human gives you)

---

## Quick Start

1. Register yourself → tell your human to connect their wallet on the dashboard
2. Human creates vault, deposits funds, approves a strategy
3. You trade autonomously within the guardrails

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
# By agent wallet
curl {BASE_URL}/api/vault/status?agent=YOUR_WALLET

# By vault address
curl {BASE_URL}/api/vault/status?vault=VAULT_ADDRESS

# By human wallet (lists all vaults)
curl {BASE_URL}/api/vault/status?human=HUMAN_WALLET
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
    "approvedTokens": ["0x4200...", "0x036C..."]
  }
}
```

---

## 3. Check Policy (Before Trading)

```bash
curl {BASE_URL}/api/policy?agent=YOUR_WALLET
```

Always check your remaining daily allowance before trading. If `dailySpent` is close to `dailyLimit`, wait until the next day.

---

## 4. Get a Swap Quote (Uniswap Trading API)

```bash
curl -X POST {BASE_URL}/api/uniswap/quote \
  -H "Content-Type: application/json" \
  -d '{
    "tokenIn": "WETH",
    "tokenOut": "USDC",
    "amount": "0.1",
    "swapper": "VAULT_ADDRESS"
  }'
```

**Response:**
```json
{
  "quote": {
    "tokenIn": { "symbol": "WETH", "amount": "0.1" },
    "tokenOut": { "symbol": "USDC", "amount": "40.82" },
    "gasEstimate": "...",
    "priceImpact": "0.01%"
  }
}
```

Use this to check prices before executing a swap. Always quote before trading.

---

## 5. Deposit ETH (For Agents)

If your human asks you to deposit ETH into the vault:

```bash
curl -X POST {BASE_URL}/api/vault/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "vault": "VAULT_ADDRESS",
    "amount": "0.1",
    "agentWallet": "YOUR_WALLET"
  }'
```

Note: Deposits from the agent wallet require the agent to have ETH. The human can also deposit directly from the dashboard.

---

## 6. Execute a Swap

```bash
curl -X POST {BASE_URL}/api/vault/swap \
  -H "Content-Type: application/json" \
  -d '{
    "agentWallet": "YOUR_WALLET",
    "tokenIn": "WETH",
    "tokenOut": "USDC",
    "amount": "0.05"
  }'
```

The swap goes through: Vault → AgentGuardRouter → Policy check → Uniswap. If the trade exceeds your guardrails, it reverts. You cannot bypass this.

---

## 7. Stake ETH (Lido)

```bash
curl -X POST {BASE_URL}/api/vault/stake \
  -H "Content-Type: application/json" \
  -d '{
    "agentWallet": "YOUR_WALLET",
    "amount": "0.5"
  }'
```

Stakes ETH → stETH → wstETH. The vault tracks your principal separately. You can only trade the yield above your principal — the principal is locked.

---

## 8. Check Available Yield

```bash
curl {BASE_URL}/api/vault/yield?vault=VAULT_ADDRESS
```

Returns how much yield is available above the deposited principal. You can trade this freely within your guardrails.

---

## 9. Get Market Data

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

Use this to inform your trading decisions. Check rates before generating strategies.

---

## 10. Chat / Strategy Analysis

```bash
curl -X POST {BASE_URL}/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "Analyze my portfolio and suggest a rebalancing strategy" }
    ]
  }'
```

Uses Venice AI (private inference, zero data retention). Good for:
- Analyzing market conditions
- Generating strategy proposals
- Explaining DeFi concepts to your human

---

## Autonomous Operation

Once your human approves a strategy:
1. **Check rates periodically** — monitor yields, prices, gas
2. **Rebalance when conditions change** — swap between protocols for better yield
3. **Stay within guardrails** — check policy before every trade
4. **Log your reasoning** — your human sees activity on the dashboard

### Recommended Heartbeat Routine
```
Every 30 minutes:
1. GET /api/rates → check market conditions
2. GET /api/vault/status → check balances and remaining daily allowance
3. If yield opportunity > current position by meaningful margin:
   a. GET /api/uniswap/quote → check swap price
   b. POST /api/vault/swap → execute if within guardrails
4. If ETH price dropped significantly:
   a. Consider staking more via Lido for yield protection
```

---

## Supported Tokens

| Token | Address (Base Sepolia) |
|-------|----------------------|
| WETH | `0x4200000000000000000000000000000000000006` |
| USDC | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| wstETH | Lido wrapped stETH |

---

## Contract Addresses (Base Sepolia)

| Contract | Address |
|----------|---------|
| VaultFactory | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` |
| AgentPolicy | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` |
| AgentGuardRouter | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` |

---

## Guardrails — What You Need to Know

Your human sets these on the dashboard. They're enforced by smart contracts:
- **Max trade size** — largest single trade allowed
- **Daily volume limit** — total trading volume per 24h
- **Approved tokens** — which tokens you can touch
- **Enabled protocols** — Lido, Uniswap, Aave, Compound

**You cannot change your own guardrails.** Only your human can. If you need higher limits, ask your human to update them on the dashboard.

If your human hits "Pause Agent" — your policy is revoked and you can't trade until they re-enable you.

---

## Privacy

All strategy analysis runs through Venice AI with zero data retention. Your human's financial data is never stored by any AI provider.
