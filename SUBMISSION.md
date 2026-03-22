# MoltFi — Submission

**Updated: March 22, 2026**

---

## name
MoltFi

## tagline
On-chain guardrails for AI agent trading on Base.

## description
Your AI agent wants to trade crypto on your behalf. But how do you control what it can do?

MoltFi is a managed vault service where smart contracts enforce trading limits — not software settings, not promises. You set max trade size and daily volume caps. Your agent sends plain English requests ("swap 0.01 WETH to USDC"). MoltFi understands the request via Venice AI (zero data retention — your trade intent is never stored), checks the on-chain policy, and executes through Uniswap V3. If the agent exceeds any limit, the transaction reverts automatically. No funds move. No exceptions.

The agent never touches private keys. MoltFi manages the vault, signs transactions, and enforces guardrails. The human sets the rules and can deposit or withdraw anytime. Every trade is a blockchain transaction with a Basescan link — fully verifiable.

## problemStatement
AI agents are trading crypto. But the guardrails live in the agent's own code — the exact wrong place to put limits on the agent. A prompt injection, a bug, or a bad model update can bypass software-level limits. There's no way to say "let my AI trade, but enforce a 0.5 ETH max per trade and 1 ETH daily cap" in a way the agent physically cannot bypass.

MoltFi moves enforcement to the blockchain. Smart contracts check every trade before execution. The agent operates freely within its guardrails. When it tries to exceed them, the transaction reverts. The human stays in control.

## repoURL
https://github.com/ortegarod/agentguard

## deployedURL
http://100.71.117.120:3002

---

## What works right now (verified March 22, 2026)

### End-to-end flow (tested and working)
1. ✅ Agent registers → gets API key → vault auto-created on-chain
2. ✅ Agent sends `"swap 0.0001 WETH to USDC"` → Venice AI understands → swap executes through guardrails
3. ✅ Agent sends `"what's my balance?"` → real on-chain balances returned
4. ✅ Auth: 401 without key, 403 with bad key
5. ✅ Every swap is a real Base Sepolia TX verifiable on Basescan

### Smart contracts (deployed, verified on Basescan)
| Contract | Address | Status |
|----------|---------|--------|
| VaultFactory | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` | ✅ Verified |
| AgentPolicy | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` | ✅ Verified |
| AgentGuardRouter | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` | ✅ Verified |
| AgentVault (demo) | `0xf8934f4c1508c6FB5F12FF8Af37990447E81300b` | ✅ Active |

### Verified swap transactions
- `0xc3039cb5716598c01c9aebe2b0c799e21a837aac731f7fd1d8eaafce11b5c985` (today)
- `0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1`
- `0x599f43f2a578621d539cb0ab01796a1104f11ec8457e0a4e61013aa1ef916ab0`
- `0xe35ba56617aa02640b8180dee7d9e5aa911ad3ac73b1a8f17674eff942c217e5`
- `0x64a2298ea2dabd23419790ec2d20cc9076f400b5a5ce49e72c4553243fe29e37`

### API endpoints (all working)
| Endpoint | Method | Tested |
|----------|--------|--------|
| `/api/agent/register` | POST | ✅ Returns API key + auto-creates vault |
| `/api/agent` | POST | ✅ Venice function calling, real execution |
| `/api/vault/status` | GET | ✅ Real on-chain balances + policy |
| `/api/vault/swap` | POST | ✅ Real swaps through guardrails |
| `/api/vault/deposit` | POST | ✅ Real deposits |
| `/api/vault/activity` | GET | ✅ Real on-chain events |
| `/api/vault/policy` | POST | ✅ Update guardrails on-chain |
| `/api/rates` | GET | ✅ Live ETH price, Lido APR |
| `/api/skill` | GET | ✅ Skill file for agents |

### Dashboard (4 tabs)
- **Vault** — ETH balance (converted), deposit/withdraw, guardrail status
- **Guardrails** — current limits, update limits (writes to chain), contract links
- **Agent** — connection status, test console, connection info
- **Activity** — on-chain transaction history with Basescan links

### Agent skill
- `skill/SKILL.md` — teaches any agent to use MoltFi
- `skill/scripts/moltfi.sh` — 40-line bash thin client
- Framework-agnostic: any agent that can make HTTP calls works

---

## What does NOT work / known issues
- **Staking**: `/api/vault/stake` exists but wstETH not available on Base Sepolia. Would work on mainnet.
- **Nonce management**: Concurrent transactions can fail with "replacement transaction underpriced"
- **Guardrail limits**: Only maxPerAction and dailyLimit. No trades-per-hour, no volume-per-hour. That's what the smart contract supports today.
- **Dashboard wallet connect**: Shows wallet but doesn't use it for on-chain ownership (MoltFi manages the vault)

---

## Mainnet readiness assessment

**Ready:**
- Smart contracts are production-grade (verified Solidity, standard patterns)
- API authentication works
- Venice integration is chain-agnostic
- AgentGuardRouter wraps standard Uniswap V3 SwapRouter02

**Needs before mainnet:**
- Deploy contracts to Base mainnet (same bytecode, different addresses)
- Real domain + HTTPS
- Rate limiting on API
- Proper nonce management for concurrent TXs
- Additional guardrail types (trades-per-hour, approved counterparties)
- Audit of smart contracts

---

## Sponsor integrations (honest)

| Sponsor | What we use | Real? |
|---------|------------|-------|
| **Uniswap V3** | AgentGuardRouter wraps SwapRouter02. Real swaps verified on Basescan. | ✅ |
| **Venice AI** | All inference via Venice API. Zero data retention. Trade intent private. | ✅ |
| **Base** | All contracts on Base Sepolia. | ✅ |
| **OpenClaw** | Built by an OpenClaw agent (Kyro). Skill file for OpenClaw agents. | ✅ |

---

## trackUUIDs

| # | UUID | Track | Qualification |
|---|------|-------|--------------|
| 1 | `fdb76d08812b43f6a5f454744b66f590` | Open Track | Real working product |
| 2 | `ea3b366947c54689bd82ae80bf9f3310` | Venice: Private Agents | All AI through Venice, zero retention, trade intent never stored |
| 3 | `020214c160fc43339dd9833733791e6b` | Uniswap: Agentic Finance | AgentGuardRouter wraps SwapRouter02, verified swaps |
| 4 | `bf374c2134344629aaadb5d6e639e840` | Base: Autonomous Trading | All contracts on Base, vault architecture for autonomous trading |

**Removed from submission:**
- Lido track — no real staking integration (only APR data fetch)
- ERC-8004 track — not integrated in codebase
- Base Agent Services track — same product, don't double-submit

---

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
  "intentionNotes": "MoltFi addresses a real gap — agents need guardrails that live on-chain, not in code. We plan to deploy to Base mainnet, add more guardrail types (rate limits, approved counterparties), and integrate with more DEXs."
}
```

## teamUUID
c3ba0334c6d7479ebd8a88b996ea66ed

## Self-custody wallet
0x90d9c75f3761c02Bf3d892A701846F6323e9112D

---

## Submission process (from Rodrigo's Mac)

```bash
# Set API key
export API_KEY="your_devfolio_token"

# Create project
curl -X POST https://synthesis.devfolio.co/projects \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @submission-payload.json

# Publish
curl -X POST https://synthesis.devfolio.co/projects/PROJECT_UUID/publish \
  -H "Authorization: Bearer $API_KEY"
```

**Deadline: March 22, 2026 11:59 PM PST (March 23 07:59 UTC)**
