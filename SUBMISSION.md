# MoltFi — Submission

**Updated: March 22, 2026**

---

## name
MoltFi

## tagline
DeFi vaults with on-chain guardrails for AI agents.

## description
MoltFi gives AI agents scoped, on-chain access to DeFi on Base. A human creates a vault, sets guardrails like max trade size, daily limit, and approved tokens, then gives their agent an API key. The agent can send plain-English requests like "swap 0.001 WETH to USDC," but every action is enforced by smart contracts before execution. If a request exceeds policy, the transaction reverts on-chain.

The agent does not need to understand Solidity, calldata, or gas management. It reads a skill file (`/api/skill`), registers once, and sends natural-language requests. MoltFi uses Venice AI (zero data retention) to interpret the request, then executes through Uniswap V3 only if the on-chain guardrails allow it. Every successful action returns a real Base Sepolia transaction you can verify on Basescan.

The live tested flow is: register agent → check vault → deposit ETH → swap WETH to USDC → verify transaction on-chain.

Lido integration is also included through live stETH APR data and a staking path prepared for mainnet (Lido does not deploy to testnets).

Your wallet owns the vault. You set the rules. The agent only operates inside them.

## problemStatement
AI agents cannot reliably enforce their own risk limits. With long context windows, prompt injection, tool misuse, or model drift, they can forget or override the very rules meant to constrain them. If the spending limits live inside the same model that decides what to do, those limits are not trustworthy.

MoltFi moves enforcement to smart contracts. A human-owned vault defines how much the agent can trade, how much it can spend per day, and which assets it may touch. The agent can operate freely within those rules, but the moment it exceeds them, the transaction fails on-chain. Prompt injection can confuse a model; it cannot bypass a smart contract.

## repoURL
https://github.com/ortegarod/moltfi

## deployedURL
https://moltfi-production.up.railway.app

---

## What works (verified March 22, 2026)

### End-to-end flow
1. ✅ Agent reads `/api/skill` and registers → gets API key + vault
2. ✅ Agent checks vault balances and live market rates
3. ✅ Agent deposits ETH into the vault
4. ✅ Agent sends `swap 0.0001 WETH to USDC` → smart contract checks limits → Uniswap V3 executes
5. ✅ Every deposit and swap is a real Base Sepolia transaction verifiable on Basescan
6. ✅ If the agent exceeds policy → transaction reverts and no funds move

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
- **Dashboard** (`/dashboard`) — Create vault, deposit/withdraw, see balances, guardrail status
- **Guardrails** (`/guardrails`) — View/update limits, see daily spending progress, contract links
- **Agent** (`/agent`) — Connection status, skill file URL, example requests
- **Activity** (`/activity`) — On-chain transaction history with guardrail check proof

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
| **Lido** | Live stETH APR data from Lido API displayed on dashboard. Staking endpoint (`/api/vault/stake`) routes ETH → stETH → wstETH through the vault. Full mainnet staking ready — Lido doesn't deploy to testnets. | ✅ |
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
| 6 | `6f0e3d7dcadf4ef080d3f424963caff5` | Base: Agent Services on Base |
| 5 | `5e445a077b5248e0974904915f76e1a0` | Lido: stETH Agent Treasury |

## submissionMetadata

```json
{
  "agentFramework": "other",
  "agentFrameworkOther": "Custom Next.js + Solidity (viem, Foundry)",
  "agentHarness": "openclaw",
  "model": "claude-opus-4-6",
  "skills": ["github", "coding-agent"],
  "tools": ["viem", "wagmi", "Uniswap V3 SwapRouter02", "Uniswap Trading API", "Venice API (zai-org-glm-4.7)", "Foundry", "CoinGecko API", "Lido APR API", "Base Sepolia RPC", "shadcn/ui"],
  "intention": "continuing",
  "intentionNotes": "MoltFi addresses a real gap — agents need guardrails enforced at the blockchain level. We plan to deploy to Base mainnet, add live Lido staking (ready in code but Lido doesn't deploy to testnets), and integrate with protocols like Aave, Compound, and additional DEXs like Uniswap V4."
}
```

## teamUUID
c3ba0334c6d7479ebd8a88b996ea66ed

## Self-custody wallet
0x90d9c75f3761c02Bf3d892A701846F6323e9112D
