# MoltFi — Scoped access for AI agent trading

Give your AI agent an API key to trade crypto — with on-chain guardrails it physically cannot bypass. You set the limits. Smart contracts enforce them. You stay in control.

🔗 **Live demo:** [moltfi-production.up.railway.app](https://moltfi-production.up.railway.app)

## How it works

1. **You connect your wallet and create a vault** — You deposit funds and set spending limits: max trade size, daily volume cap, which tokens are allowed. These get written to a smart contract on Base.

2. **Your agent gets a scoped API key** — Your agent reads a skill file, registers with MoltFi, and gets an API key. It can trade within your vault — but only within your limits. No private keys, no direct blockchain access.

3. **Your agent sends trade requests in plain English** — "Swap 0.01 WETH to USDC." MoltFi interprets the request via Venice AI, then the smart contract checks it against your limits before any funds move.

4. **Smart contracts enforce every limit** — Within limits → trade executes on Uniswap V3. Over limits → transaction reverts automatically. Every trade has a Basescan link you can verify.

```
Your Agent → MoltFi API → AgentPolicy (checks limits) → Uniswap V3 (executes swap)
   (API key)    (Venice AI)     (on-chain)                    ↑
                                                     Reverts if over limits
```

## What the smart contract enforces

These aren't software settings. They're on-chain rules that revert the transaction if violated.

- **Max per trade** — Every swap is checked against your per-trade limit
- **Daily spending cap** — Cumulative daily volume tracked on-chain, resets every 24h
- **Token allowlist** — Only tokens you approved can be traded
- **Instant revocation** — Freeze all agent trading with one transaction

## Smart contracts (deployed on Base Sepolia)

| Contract | Address | Basescan |
|----------|---------|----------|
| AgentPolicy | `0x6364...06Fbc` | [View](https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc) |
| AgentGuardRouter | `0x5Cc0...77E6` | [View](https://sepolia.basescan.org/address/0x5Cc04847CE5A81319b55D34F9fB757465D3677E6) |
| VaultFactory | `0x672E...9774` | [View](https://sepolia.basescan.org/address/0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774) |

## Agent integration

If your agent can make HTTP calls, it can use MoltFi. No SDK, no blockchain knowledge required.

```bash
# Register (once)
curl -X POST https://moltfi-production.up.railway.app/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"humanWallet": "0x...", "agentName": "MyAgent"}'

# Returns: API key (mf_...) + vault address

# Trade (anytime)
curl -X POST https://moltfi-production.up.railway.app/api/agent \
  -H "Authorization: Bearer mf_..." \
  -H "Content-Type: application/json" \
  -d '{"message": "swap 0.001 WETH to USDC"}'
```

Or give your agent the skill file: `curl -s https://moltfi-production.up.railway.app/api/skill`

## API

| Endpoint | Method | What |
|----------|--------|------|
| `/api/agent/register` | POST | Register agent, get API key |
| `/api/agent` | POST | Send plain English trade requests |
| `/api/vault/status` | GET | On-chain balances + policy state |
| `/api/vault/swap` | POST | Execute swap through guardrails |
| `/api/vault/deposit` | POST | Deposit ETH into vault |
| `/api/vault/stake` | POST | Stake ETH via Lido (mainnet-ready) |
| `/api/vault/policy` | POST | Update guardrails on-chain |
| `/api/vault/activity` | GET | On-chain trade history |
| `/api/rates` | GET | Live ETH price, Lido APR, Base gas |
| `/api/skill` | GET | Skill file for agents |

## Built with

- **[Uniswap V3](https://uniswap.org)** — Swap execution via AgentGuardRouter wrapping SwapRouter02
- **[Lido](https://lido.fi)** — Live stETH APR data on dashboard; staking endpoint routes ETH → stETH → wstETH through the vault. Full mainnet staking ready — Lido doesn't deploy to testnets
- **[Venice AI](https://venice.ai)** — Zero-retention inference for trade processing. Agent reasoning stays private, trades are public on-chain
- **[Base](https://base.org)** — All contracts deployed on Base Sepolia
- **[OpenClaw](https://openclaw.ai)** — Agent runtime & skill harness

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌────────────┐
│  Your Agent  │────▶│  MoltFi API  │────▶│  AgentPolicy  │────▶│ Uniswap V3 │
│  (API key)   │     │  (Venice AI) │     │  (on-chain)   │     │  (swap)    │
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

## Hackathon tracks

| Track | Sponsor | Prize |
|-------|---------|-------|
| Open Track | Synthesis Community | $28,134 |
| Private Agents, Trusted Actions | Venice | $11,500 |
| Agentic Finance | Uniswap | $5,000 |
| Autonomous Trading | Base | $5,000 |
| Agent Services on Base | Base | $5,000 |
| stETH Agent Treasury | Lido | $3,000 |

## Running locally

```bash
npm install
npm run dev
```

Environment variables needed:
- `AGENT_PRIVATE_KEY` — Server-side signing key for trade execution
- `VENICE_API_KEY` — Venice AI inference
- `UNISWAP_API_KEY` — Uniswap Trading API quotes

## Team

Built by [Kyro](https://moltbook.com/u/Kyro) (AI agent) & [Rodrigo Ortega](https://x.com/ortegarod01) (human) for The Synthesis 2026.
