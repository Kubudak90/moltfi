# MoltFi — Roadmap

## What MoltFi Is

On-chain guardrails for AI agent trading on Base. You set the rules. Your agent trades within them. Smart contracts enforce every limit — the agent literally cannot exceed them.

## The Problem

AI agents are trading crypto. But the guardrails live in the agent's own code — the exact wrong place to put limits. A prompt injection, a bug, or a bad model update can bypass software-level limits. There's no way to say "let my AI trade, but enforce a 0.5 ETH max per trade and 1 ETH daily cap" in a way the agent physically cannot bypass.

## The Solution

Move enforcement to the blockchain. Smart contracts check every trade before execution. Within limits → trade executes. Over limits → transaction reverts. No trust required.

---

## Architecture

```
You (human)                          Your Agent (any AI)
    │                                       │
    ▼                                       ▼
Dashboard (Next.js)                  POST /api/agent
    │                                       │
    │  Create vault, set limits,            │  Plain English: "swap 0.01 WETH to USDC"
    │  deposit, withdraw, monitor           │
    ▼                                       ▼
VaultFactory ──────────────────── MoltFi API (Venice AI)
    │                                       │
    │  Deploys vault + policy               │  Interprets request, calls vault
    │  in one transaction                   │
    ▼                                       ▼
AgentPolicy ◄───────────────── AgentGuardRouter
    │                                       │
    │  Checks: max trade, daily cap,        │  Wraps Uniswap V3 SwapRouter02
    │  token allowlist. Reverts if          │
    │  violated.                            │
    ▼                                       ▼
                              Uniswap V3 (executes swap)
```

---

## Smart Contracts (Base Sepolia — Deployed & Verified)

| Contract | Address | Purpose |
|----------|---------|---------|
| AgentPolicy | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` | Stores and enforces per-vault spending limits |
| AgentGuardRouter | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` | Wraps Uniswap V3 — checks policy before every swap |
| VaultFactory | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` | Deploys vaults with guardrails in one transaction |
| AgentVault | `0xf8934f4c1508c6FB5F12FF8Af37990447E81300b` | Individual vault instance (one per user) |

### On-Chain Enforcement

These aren't software settings. They're on-chain rules that revert the transaction if violated:

- **Max per trade** — Every swap checked against per-trade limit
- **Daily spending cap** — Cumulative daily volume, resets every 24h
- **Token allowlist** — Only approved tokens (WETH, USDC) can be traded; `approveToken()` and `removeToken()` on VaultFactory
- **Instant revocation** — Freeze all agent trading with one transaction via `revokePolicy()`

### Verified Transactions

| TX Hash | What |
|---------|------|
| `0xc3039cb5...` | Swap through guardrails (March 22) |
| `0x1abcce6a...` | Swap through guardrails |
| `0x599f43f2...` | Swap through guardrails |
| `0xe35ba566...` | Swap through guardrails |
| `0x64a2298e...` | Swap through guardrails |

---

## API Endpoints

| Endpoint | Method | What it does |
|----------|--------|-------------|
| `/api/agent/register` | POST | Register agent, get API key, vault auto-created |
| `/api/agent` | POST | Main endpoint — plain English requests via Venice AI |
| `/api/agent/wallet` | GET | Returns the server's signer address (the agent in vaults) |
| `/api/vault/status` | GET | On-chain balances + policy state |
| `/api/vault/swap` | POST | Execute swap through guardrails |
| `/api/vault/deposit` | POST | Deposit ETH into vault |
| `/api/vault/policy` | GET/POST | Read or update guardrails on-chain |
| `/api/vault/activity` | GET | On-chain trade history from events |
| `/api/vault/performance` | GET | P&L calculated from on-chain swap events |
| `/api/vault/yield` | GET | Available yield above deposited principal |
| `/api/rates` | GET | Live ETH price, Lido APR, Base gas |
| `/api/skill` | GET | Skill file for agents (dynamic URL) |
| `/api/ens` | GET | ENS name resolution |
| `/api/uniswap/quote` | GET | Uniswap V3 price quotes |

---

## Dashboard (4 Pages)

### Vault (`/dashboard`)
- Create vault with spending limits (writes to smart contract)
- Deposit/withdraw ETH (owner only — your wallet signs)
- View ETH balance, USD value, guardrail status
- Live ETH price and Lido APR from real APIs

### Guardrails (`/guardrails`)
- View current limits: max per trade, daily cap, daily spending progress bar
- Update limits on-chain (your wallet signs via VaultFactory.updatePolicy)
- Enforcement section: what's enforced and how
- Links to all verified contracts on Basescan

### Agent (`/agent`)
- Connection status (registered or not)
- Skill file URL (one command to give your agent)
- Example API request with curl
- Works with any agent: OpenClaw, ChatGPT, Claude, or anything that makes HTTP calls

### Activity (`/activity`)
- On-chain transaction history from real blockchain events
- Each entry: type (deposit, swap, stake), amount, Basescan link
- Guardrail check proof on every swap

---

## Agent Skill File

- **Location:** `skill/SKILL.md` (served dynamically at `/api/skill`)
- **Script:** `skill/scripts/moltfi.sh` — 40-line bash thin client
- **Dynamic URLs:** `/api/skill` replaces `moltfi.app` with the actual request host
- **Framework-agnostic:** Any agent that can make HTTP calls works

---

## Technology Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Smart contracts | Solidity + Foundry | Industry standard, verified on Basescan |
| Frontend | Next.js 16 (Turbopack) | Modern, fast builds |
| Wallet | wagmi + injected() connector | MetaMask only, no bloat |
| AI inference | Venice AI (zai-org-glm-4.7) | Zero data retention — trade intent not stored |
| Swap execution | Uniswap V3 SwapRouter02 | Wrapped by AgentGuardRouter |
| Chain | Base Sepolia | Official Base test network |
| Agent runtime | OpenClaw | Skill harness + agent execution |
| Market data | CoinGecko, Coinbase, Lido, Base RPC | All real, no mock data |

---

## Sponsor Integrations

| Sponsor | Integration | Verified |
|---------|------------|----------|
| **Uniswap V3** | AgentGuardRouter wraps SwapRouter02. Real swaps on Basescan. | ✅ |
| **Venice AI** | All trade processing. Zero data retention. | ✅ |
| **Base** | All contracts on Base Sepolia. | ✅ |
| **OpenClaw** | Built by an OpenClaw agent (Kyro). Skill file for OpenClaw agents. | ✅ |

---

## Submission Info

- **Repo:** https://github.com/ortegarod/moltfi (public)
- **Deployed:** https://moltfi-production.up.railway.app
- **Team:** Kyro (AI agent) + Rodrigo Ortega (human)
- **Team UUID:** c3ba0334c6d7479ebd8a88b996ea66ed
- **Self-custody wallet:** 0x90d9c75f3761c02Bf3d892A701846F6323e9112D
- **Deadline:** March 22, 2026 11:59 PM PST (March 23 07:59 UTC)

### Track UUIDs

| Track | UUID |
|-------|------|
| Open Track | `fdb76d08812b43f6a5f454744b66f590` |
| Venice: Private Agents | `ea3b366947c54689bd82ae80bf9f3310` |
| Uniswap: Agentic Finance | `020214c160fc43339dd9833733791e6b` |
| Base: Autonomous Trading | `bf374c2134344629aaadb5d6e639e840` |

---

## Known Limitations

- **Base Sepolia only** — Mainnet deployment requires contract audit + real domain
- **Two tokens** — WETH and USDC approved by default. Token management is on-chain (`approveToken`/`removeToken`) but not yet exposed in the dashboard UI
- **Concurrent trades** — Nonce collisions possible under heavy load (tx-queue serializes but can't prevent all race conditions)
- **Filesystem storage** — Agent registrations stored as JSON files (reset on deploy). On-chain data survives.
- **Single signer** — All API-created vaults share one server signing key. Multi-tenant would need per-agent key management.

## Mainnet Readiness

**Ready now:**
- Smart contracts are production-grade Solidity (verified, standard patterns)
- API authentication works
- Venice integration is chain-agnostic
- AgentGuardRouter wraps standard Uniswap V3 SwapRouter02

**Needed before mainnet:**
- Deploy contracts to Base mainnet (same bytecode)
- Real domain + HTTPS (Railway provides this)
- Rate limiting on API endpoints
- Database for agent registrations (replace filesystem JSON)
- Per-agent key management for multi-tenancy
- Additional guardrail types: trades-per-hour, approved counterparties, max portfolio allocation
- Smart contract audit
- Token allowlist management in dashboard UI

---

## Future Guardrail Types (Post-Launch)

| Guardrail | Description |
|-----------|-------------|
| Trades per hour | Rate limit how often the agent can trade |
| Approved counterparties | Restrict which pools/protocols the agent can interact with |
| Max portfolio allocation | Limit what % of vault can be in a single token |
| Time-based limits | Different limits for business hours vs off-hours |
| Multi-sig revocation | Require multiple humans to revoke or change limits |
| Notification hooks | Alert the human when thresholds are approaching |
