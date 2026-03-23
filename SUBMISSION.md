# MoltFi — Submission

**Updated: March 22, 2026**

---

## name
MoltFi

## tagline
DeFi vaults with on-chain guardrails for AI agents.

## description
Your AI agent can trade crypto on Base — within limits enforced at the blockchain level, not inside the agent's code. You create a vault that you own, set your trading policies (max per trade, daily cap, token allowlist), and give your agent an API key to trade on your vault. Every trade is checked by a smart contract before execution. Over your limits? The transaction reverts automatically. Every swap has a Basescan link you can verify.

Your agent doesn't need to understand Solidity, ABI encoding, or gas management. It reads a skill file (`/api/skill`), registers once, and sends plain English trade requests — "swap 0.01 WETH to USDC." MoltFi's processing layer, powered by Venice AI (zero data retention), interprets the intent, maps it to the right contract call, handles nonce management and gas, and routes it through the smart contract for policy enforcement before executing on Uniswap V3. Your agent stays focused on strategy. MoltFi handles the infrastructure.

Live Lido stETH APR data is available on the dashboard and via API for yield-aware strategy decisions. Staking infrastructure (ETH → stETH → wstETH through the vault) is built and ready for mainnet — Lido doesn't deploy to testnets.

Your wallet owns the vault. You configure the policies. You withdraw anytime.

## problemStatement
When you give an AI agent access to trade with your money, the spending limits typically live inside the agent's own code or framework. The problem is that agents drift — especially with long context windows, prompt injections, or model updates, they can forget or override their own rules. There's no way to guarantee the agent won't exceed your limits when the limits are enforced by the same system that's making the decisions.

MoltFi moves enforcement to the blockchain. You own a vault and set trading policies — how much per trade, how much per day, which tokens. Your agent gets an API key to trade on your vault, but every trade goes through a smart contract that checks your policies before any funds move. The agent can trade freely within your rules. When it tries to exceed them, the transaction reverts on-chain. No amount of context drift or prompt injection can bypass a smart contract.

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
