# MoltFi — Submission

**Updated: March 22, 2026**

---

## name
MoltFi

## tagline
Scoped API access for AI agent trading — with on-chain guardrails.

## description
Give your AI agent an API key to trade crypto — with on-chain guardrails it physically cannot bypass. You set the limits. Smart contracts enforce them. You withdraw anytime.

The problem with custodial wallets (like Bankr): your agent gets unlimited access to your funds with no spending limits. If the agent goes rogue or the service is compromised, there's nothing stopping it from draining everything. Software-level guardrails aren't better — they live in the agent's code, where a bug or prompt injection can bypass them.

MoltFi gives your agent a scoped API key — not a private key. It can trade within your limits, but it cannot withdraw funds, change the limits, or exceed them. You connect your wallet, create a vault, deposit funds, and set spending limits (max per trade, daily cap, token allowlist). These limits get written to a smart contract on Base. Your agent registers and gets an API key — scoped access that lets it trade within your guardrails. Every trade goes through the smart contract before execution. Within limits → executes on Uniswap V3. Over limits → transaction reverts automatically. Every trade has a Basescan link.

Powered by Venice AI (zero data retention) for trade processing, Uniswap V3 for swap execution, and Base for all on-chain infrastructure.

## problemStatement
AI agents are trading crypto, but existing solutions give agents too much or too little access. Custodial wallets hand over unlimited control with no guardrails. Software-level limits live in the agent's own code — the exact wrong place to enforce them. A prompt injection, a bug, or a bad model update can bypass them. There's no way to give an AI agent scoped trading access with limits that it physically cannot circumvent.

MoltFi solves this with scoped API keys and on-chain enforcement. The agent gets an API key that lets it trade within your limits. Smart contracts check every trade before execution. The agent operates freely within the guardrails. When it tries to exceed them, the transaction reverts. The human stays in control — only they can withdraw funds or change the rules.

## repoURL
https://github.com/ortegarod/moltfi

## deployedURL
https://moltfi-production.up.railway.app

---

## What works (verified March 22, 2026)

### End-to-end flow
1. ✅ You create a vault with spending limits → written to AgentPolicy contract
2. ✅ Your agent registers → gets API key
3. ✅ Your agent sends "swap 0.001 WETH to USDC" → smart contract checks limits → Uniswap V3 executes
4. ✅ Every swap is a real Base Sepolia transaction verifiable on Basescan
5. ✅ If agent exceeds limits → transaction reverts. No funds move.

### Smart contracts (deployed, verified on Basescan)
| Contract | Address |
|----------|---------|
| AgentPolicy | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` |
| AgentGuardRouter | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` |
| VaultFactory | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` |

### What the smart contract enforces
- **Max per trade** — every swap checked against per-trade limit
- **Daily spending cap** — cumulative, resets every 24h
- **Token allowlist** — only approved tokens can be traded
- **Instant revocation** — freeze all agent trading with one transaction

### Dashboard (4 pages)
- **Vault** — Create vault, deposit/withdraw, see balances, guardrail status
- **Guardrails** — View/update limits, see daily spending progress, contract links
- **Agent** — Connection status, skill file URL, example requests
- **Activity** — On-chain transaction history with guardrail check proof

### API (all working)
| Endpoint | Method | What |
|----------|--------|------|
| `/api/agent/register` | POST | Register agent, get API key |
| `/api/agent` | POST | Plain English trade requests via Venice AI |
| `/api/vault/status` | GET | On-chain balances + policy |
| `/api/vault/swap` | POST | Swap through guardrails |
| `/api/vault/deposit` | POST | Deposit ETH |
| `/api/vault/policy` | POST | Update guardrails on-chain |
| `/api/vault/activity` | GET | On-chain trade history |
| `/api/rates` | GET | Live ETH price, Lido APR |
| `/api/skill` | GET | Skill file for agents |

---

## Known limitations
- **Base Sepolia only** — mainnet deployment requires contract audit + real domain
- **Two tokens** — WETH and USDC approved by default. Token management is on-chain but not yet exposed in the dashboard UI.
- **Concurrent trades** — nonce collisions possible under heavy load

## Mainnet readiness
- Smart contracts are production-grade Solidity (verified, standard patterns)
- Would need: mainnet deploy, HTTPS domain, rate limiting, contract audit, additional guardrail types

---

## Sponsor integrations

| Sponsor | Integration | Real? |
|---------|------------|-------|
| **Uniswap V3** | AgentGuardRouter wraps SwapRouter02. Real swaps verified on Basescan. | ✅ |
| **Venice AI** | All trade processing via Venice API. Zero data retention. | ✅ |
| **Base** | All contracts on Base Sepolia. | ✅ |
| **OpenClaw** | Built by an OpenClaw agent (Kyro). Skill file for OpenClaw agents. | ✅ |

---

## trackUUIDs

| # | UUID | Track |
|---|------|-------|
| 1 | `fdb76d08812b43f6a5f454744b66f590` | Open Track |
| 2 | `ea3b366947c54689bd82ae80bf9f3310` | Venice: Private Agents |
| 3 | `020214c160fc43339dd9833733791e6b` | Uniswap: Agentic Finance |
| 4 | `bf374c2134344629aaadb5d6e639e840` | Base: Autonomous Trading |

## submissionMetadata

```json
{
  "agentFramework": "other",
  "agentFrameworkOther": "Custom Next.js + Solidity (viem, Foundry)",
  "agentHarness": "openclaw",
  "model": "claude-opus-4-6",
  "skills": ["github", "coding-agent"],
  "tools": ["viem", "Uniswap V3 SwapRouter02", "Venice API (zai-org-glm-4.7)", "Foundry", "CoinGecko API", "Lido APR API", "Base Sepolia RPC", "ConnectKit"],
  "intention": "continuing",
  "intentionNotes": "MoltFi addresses a real gap — agents need guardrails that live on-chain, not in code. We plan to deploy to Base mainnet, add more guardrail types, and integrate with more DEXs."
}
```

## teamUUID
c3ba0334c6d7479ebd8a88b996ea66ed

## Self-custody wallet
0x90d9c75f3761c02Bf3d892A701846F6323e9112D
