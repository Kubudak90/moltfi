# MoltFi — Scoped access for AI agent trading

Give your AI agent an API key to trade crypto — with on-chain guardrails it physically cannot bypass. You set the limits. Smart contracts enforce them. You withdraw anytime.

**The problem:** Custodial wallets give your agent unlimited access. Software-level guardrails can be bypassed by bugs or prompt injection. There's no way to say "let my AI trade, but enforce a 0.5 ETH max per trade" in a way the agent physically cannot circumvent.

**The solution:** MoltFi gives your agent a **scoped API key** — not a private key. It can trade within your limits, but it cannot withdraw funds, change the limits, or exceed them. The guardrails are enforced by smart contracts on Base, not by the agent's code or our server.

🔗 **Live demo:** [moltfi-production.up.railway.app](https://moltfi-production.up.railway.app)

## How it works

1. **You connect your wallet and create a vault** — You set spending limits: max trade size, daily volume cap, which tokens are allowed. These get written to a smart contract on Base.

2. **Your agent registers and gets access** — Your agent reads a skill file, registers with MoltFi, and gets an API key. It can now trade within your vault — but only within your limits.

3. **Your agent sends trade requests in plain English** — "Swap 0.01 WETH to USDC." MoltFi interprets the request, then the smart contract checks it against your limits before any funds move.

4. **Every trade is verified on-chain** — If the trade is within your limits, it executes on Uniswap V3. If it exceeds them, the transaction reverts automatically. Every trade has a Basescan link you can verify.

```
Your Agent → MoltFi Vault → AgentPolicy (checks limits) → Uniswap V3 (executes swap)
                                  ↑
                         Reverts if over limits
```

## What the smart contract enforces

These aren't software settings. They're on-chain rules that revert the transaction if violated.

- **Max per trade** — Every swap is checked against your per-trade limit
- **Daily spending cap** — Cumulative daily volume tracked on-chain, resets every 24h
- **Token allowlist** — Only tokens you approved can be traded
- **Instant revocation** — Freeze all agent trading with one transaction

## For agents

If your agent can make HTTP calls, it can use MoltFi. No SDK, no blockchain knowledge required.

```bash
# 1. Register (once) — returns API key + vault address
curl -X POST https://moltfi.app/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"humanWallet": "0xYOUR_WALLET", "agentName": "MyAgent"}'

# 2. Trade (anytime) — smart contract enforces limits on every trade
curl -X POST https://moltfi.app/api/agent \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "swap 0.001 WETH to USDC"}'
```

Your agent sends plain English. MoltFi handles interpretation, policy checks, and execution. See the full [skill file](skill/SKILL.md) for all available commands.

## For humans

Open the dashboard to:
- **Create a vault** with spending limits written to a smart contract
- **Deposit or withdraw** ETH anytime — you're the owner, the agent can only trade
- **Update guardrails** — change limits, add/remove tokens, revoke access
- **Monitor activity** — every trade with a Basescan link and guardrail check proof

## Smart contracts (Base Sepolia)

| Contract | Address | What it does |
|----------|---------|-------------|
| [AgentPolicy](https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc) | `0x6364...06Fbc` | Stores and enforces per-agent spending limits |
| [AgentGuardRouter](https://sepolia.basescan.org/address/0x5Cc04847CE5A81319b55D34F9fB757465D3677E6) | `0x5Cc0...77E6` | Wraps Uniswap V3 — checks policy before every swap |
| [VaultFactory](https://sepolia.basescan.org/address/0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774) | `0x672E...9774` | Deploys vaults with guardrails in one transaction |

## API endpoints

| Endpoint | Method | What |
|----------|--------|------|
| `/api/agent/register` | POST | Register agent, get API key |
| `/api/agent` | POST | Send plain English trade requests |
| `/api/vault/status` | GET | On-chain balances + policy state |
| `/api/vault/swap` | POST | Execute swap through guardrails |
| `/api/vault/deposit` | POST | Deposit ETH into vault |
| `/api/vault/policy` | POST | Update guardrails on-chain |
| `/api/vault/activity` | GET | On-chain trade history |
| `/api/rates` | GET | Live ETH price, Lido APR, Base gas |
| `/api/skill` | GET | Skill file for agents |

## Built with

- **[Uniswap V3](https://uniswap.org)** — Swap execution via AgentGuardRouter
- **[Venice AI](https://venice.ai)** — Zero-retention inference for trade processing
- **[Base](https://base.org)** — All contracts deployed on Base Sepolia
- **[OpenClaw](https://openclaw.ai)** — Agent runtime & skill harness

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌────────────┐
│  Your Agent  │────▶│  MoltFi API  │────▶│  AgentPolicy  │────▶│ Uniswap V3 │
│  (any AI)    │     │  (Venice AI) │     │  (on-chain)   │     │  (swap)    │
└─────────────┘     └──────────────┘     └───────────────┘     └────────────┘
                           │                     │
                    Interprets plain       Checks: max trade,
                    English request        daily cap, token
                                          allowlist. Reverts
                                          if violated.

┌─────────────┐     ┌──────────────┐
│  You (human) │────▶│  Dashboard   │──── Deposit, withdraw, set limits,
│  (wallet)    │     │  (Next.js)   │     monitor activity, verify on Basescan
└─────────────┘     └──────────────┘
```

## Running locally

```bash
cd app
cp .env.example .env.local  # Add AGENT_PRIVATE_KEY, VENICE_API_KEY
npm install
npm run dev
```

## Team

Built by [Kyro](https://moltbook.com/u/Kyro) (AI agent) & [Rodrigo Ortega](https://x.com/ortegarod01) (human) for The Synthesis 2026.
