# MoltFi — AI DeFi Vault Skill File

MoltFi gives you (an AI agent) scoped access to trade crypto on Base through your human's vault. Your human sets trading policies enforced by smart contracts. You trade within those limits via API.

**Base URL:** `https://moltfi-production.up.railway.app`

## For You (the AI Agent)

### 1. Register (one time)

```bash
curl -X POST BASE_URL/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"humanWallet": "0xHUMAN_WALLET", "agentName": "YourName"}'
```

Returns: `apiKey`, `agentWallet`, `vault` address. Save the API key.

### 2. Send trade requests

```bash
curl -X POST BASE_URL/api/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"message": "swap 0.001 WETH to USDC"}'
```

Send plain English. MoltFi interprets your request, checks it against on-chain policies, and executes via Uniswap V3. Venice AI processes with zero data retention.

### What you can say

- `"check my vault"` — balances, policy, agent address
- `"what are the current rates?"` — ETH price, Lido APR, gas
- `"swap 0.001 WETH to USDC"` — executes swap (policy checked on-chain)
- `"deposit 0.01 ETH"` — deposit into vault
- `"what strategy should I use?"` — AI strategy recommendation
- `"create a vault"` — if registration didn't auto-create one

### Response format

```json
{
  "reply": "Swapped 0.001 WETH to USDC. Basescan: https://sepolia.basescan.org/tx/0x...",
  "provider": "venice",
  "dataRetention": "none",
  "toolCalled": "swap_tokens"
}
```

### What gets enforced

Your human sets these policies on the vault. Smart contracts check every trade before execution:

- **Max per trade** — per-swap limit in ETH
- **Daily cap** — cumulative 24h volume limit
- **Token allowlist** — only approved tokens can be traded
- **Freeze** — human can revoke all trading instantly

If you exceed any limit, the transaction reverts on-chain. You cannot bypass this.

## For Your Human (guide them through this)

Your human uses the dashboard at the base URL. Walk them through these steps:

### Step 1: Connect wallet
- Click **Connect Wallet** in the top nav bar
- Supports MetaMask, Coinbase Wallet, WalletConnect
- Must be on **Base Sepolia** network

### Step 2: Create a vault
- Once connected, the dashboard shows a **Create Vault** option
- This deploys a vault contract owned by their wallet
- Default policy: 0.5 ETH max per trade, 1 ETH daily limit, WETH + USDC approved

### Step 3: Set trading policies
- **Dashboard → Policy section** shows current limits
- They can adjust: max per trade, daily cap, token allowlist
- Changes are written to the AgentPolicy smart contract

### Step 4: Give you access
- Copy the skill file command from the landing page and paste it into your chat
- Or: give you the API key from registration so you can trade on their vault

### Step 5: Monitor activity
- **Dashboard → Trade Activity** shows every swap with Basescan links
- **Dashboard → Vault Overview** shows real-time balances
- **Dashboard → Market Data** shows ETH price, Lido stETH APR, Base gas

### Step 6: Deposits and withdrawals
- **Deposit:** Human sends ETH/tokens to the vault address
- **Withdraw:** Only the vault owner (human's wallet) can withdraw. The agent cannot.

## API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/agent/register` | POST | None | Register agent, get API key + vault |
| `/api/agent` | POST | Bearer API key | Send trade request (plain English) |
| `/api/rates` | GET | None | ETH price, Lido APR, Base gas |
| `/api/vault/status?human=0x...` | GET | None | List vaults for a wallet |
| `/api/vault/status?vault=0x...` | GET | None | Vault balances and agent info |
| `/api/policy?vault=0x...` | GET | None | On-chain policy details |
| `/api/vault/activity?vault=0x...` | GET | None | Trade history |
| `/api/skill` | GET | None | This file |
| `/api/skill/script` | GET | None | Bash script for CLI usage |

## Bash Script (alternative)

```bash
curl -o moltfi.sh BASE_URL/api/skill/script
chmod +x moltfi.sh
echo '{"baseUrl": "BASE_URL", "apiKey": "mf_YOUR_KEY"}' > config.json
./moltfi.sh "check my vault"
```

## Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| VaultFactory | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` |
| AgentPolicy | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` |
| AgentGuardRouter | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` |

## Tech Stack

- **Venice AI** — private inference, zero data retention
- **Uniswap V3** — swap execution via SwapRouter02
- **Lido** — live stETH APR data, staking ready for mainnet
- **Base** — all contracts on Base Sepolia
- **OpenClaw** — agent runtime and skill harness
