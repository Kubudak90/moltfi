# MoltFi — Master Roadmap

**STATUS: Final submission push.**

Deadline: **March 22, 2026 11:59 PM PST** (March 23 07:59 UTC)

---

## WHAT MOLTFI IS

On-chain guardrails for AI agent trading on Base.

Your agent decides what to trade. MoltFi enforces the rules. Smart contracts check every transaction against your limits — max trade size, daily volume cap, approved tokens. If the agent tries to exceed them, the trade reverts. No trust required.

**The flow:**
1. Human registers agent → vault created automatically with guardrails
2. Human sets limits on dashboard → written to AgentPolicy smart contract
3. Agent sends plain English requests → `"swap 0.001 WETH to USDC"`
4. MoltFi API (Venice AI) understands the request, routes through vault
5. Vault → AgentGuardRouter → AgentPolicy check → Uniswap V3 execution
6. If within limits: trade executes. If exceeds: transaction reverts.
7. Every trade has a Basescan link. Fully verifiable.

**What MoltFi is NOT:**
- Not a strategy advisor (the agent decides what to trade)
- Not a portfolio manager (we enforce rules, not make decisions)
- Not a wallet (funds live in the vault smart contract)

---

## SMART CONTRACTS (Base Sepolia — deployed, verified)

| Contract | Address | What |
|----------|---------|------|
| VaultFactory | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` | One-TX vault deployment + policy setup |
| AgentPolicy | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` | Per-agent spending rules, enforced on every trade |
| AgentGuardRouter | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` | Wraps Uniswap V3, checks policy before every swap |
| AgentVault (demo) | `0xf8934f4c1508c6FB5F12FF8Af37990447E81300b` | Holds funds, tracks principal vs yield |

**Verified swap:** `0x1abcce6a...` — real WETH→USDC through guardrails on Basescan.

**How contracts connect:**
```
Agent → MoltFi API → AgentGuardRouter.swap()
  → AgentPolicy.enforceAndRecord() — checks limits, reverts if exceeded
  → Uniswap V3 SwapRouter02 — executes trade
```

---

## API ENDPOINTS

| Endpoint | Method | What |
|----------|--------|------|
| `/api/agent/register` | POST | Register agent, get API key, vault auto-created |
| `/api/agent` | POST | **Main endpoint** — send plain English, Venice AI picks the right tool, executes |
| `/api/vault/status` | GET | Real on-chain balances + policy state |
| `/api/vault/swap` | POST | Execute swap through guardrails |
| `/api/vault/deposit` | POST | Deposit ETH into vault |
| `/api/vault/activity` | GET | On-chain trade history |
| `/api/vault/yield` | GET | Principal vs yield |
| `/api/rates` | GET | Live ETH price, Lido APR, Base gas |
| `/api/skill` | GET | Skill file for any agent |

**Auth:** API key (`Authorization: Bearer mf_...`) required on `/api/agent`. Register to get one.

**Venice AI role:** Understands natural language requests, picks the right API tool to call. Does NOT make trading decisions. Zero data retention.

---

## WEB DASHBOARD

**Two tabs:**
- **Vault** — balances (total USD + token breakdown), guardrails (max per trade, daily limit, used today, remaining), deposit/withdraw, recent activity
- **Activity** — full trade history with Basescan links, guardrail proof per trade

**Landing page** — explains the product: agent trades, vault enforces guardrails, everything verifiable on-chain.

---

## AGENT SKILL

`skill/SKILL.md` — one file teaches any agent to use MoltFi:
1. Register → get API key
2. Send messages to `/api/agent` → MoltFi handles everything
3. No blockchain tooling needed

`skill/scripts/moltfi.sh` — 40-line bash wrapper for the API.

---

## SPONSOR INTEGRATIONS (honest)

| Sponsor | Integration | Prize Track? | Real? |
|---------|------------|--------------|-------|
| Uniswap V3 | AgentGuardRouter wraps SwapRouter02, real swaps verified | Up to $5,000 | ✅ |
| Venice AI | Private inference for NLU, zero data retention | Sponsor (TBD) | ✅ |
| Base | All contracts on Base Sepolia | Platform | ✅ |
| OpenClaw | Agent runtime + skill harness | Sponsor | ✅ |

**Removed:**
- Lido — only fetching APR number, not real integration, no confirmed bounty, staking doesn't work on testnet
- ERC-8004 — not integrated in the codebase

---

## SUBMISSION STATUS

- [x] Smart contracts deployed and verified
- [x] Real swaps through guardrails (multiple TXs today)
- [x] API with Venice function calling + API key auth
- [x] Dashboard (vault + activity)
- [x] Skill file + bash script
- [x] Landing page
- [ ] Push to GitHub (needs Rodrigo approval)
- [ ] Make repo public
- [ ] Update SUBMISSION.md
- [ ] Submit via Devfolio API (from Rodrigo's Mac — Cloudflare blocks VPS)

---

## KEY DECISIONS (Rodrigo — final)

1. **No mock data.** Real API/RPC/DB or show nothing.
2. **No strategy generation.** Agent decides what to trade, vault enforces limits.
3. **Agent doesn't need a wallet.** MoltFi handles all blockchain operations.
4. **Plain English API.** Agent sends a message, Venice understands it, vault executes.
5. **API key auth.** Register once, trade with your key.
6. **Guardrails are the product.** Not strategies, not portfolio management, not AI advice.
7. **Privacy by architecture.** Venice is the only LLM. No fallback. If Venice is down, nothing works.

---

## FILE LOCATIONS

| What | Path |
|------|------|
| This roadmap | `~/repos/agentguard/ROADMAP.md` |
| Contracts | `~/repos/agentguard/contracts/src/` |
| Web app | `~/repos/agentguard/app/` |
| Agent endpoint | `app/app/api/agent/route.ts` |
| Register endpoint | `app/app/api/agent/register/route.ts` |
| Skill file | `~/repos/agentguard/skill/SKILL.md` |
| Skill script | `~/repos/agentguard/skill/scripts/moltfi.sh` |
| Submission draft | `~/repos/agentguard/SUBMISSION.md` |
