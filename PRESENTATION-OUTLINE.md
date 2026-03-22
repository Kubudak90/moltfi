# MoltFi — Presentation Outline (10 Slides)

Feed this entire document into Gamma or your AI presentation tool. It contains all the context, talking points, and specifics needed to generate a complete slide deck.

---

## Slide 1: Title

**MoltFi — On-chain guardrails for AI agent trading**

- Built on Base. Powered by Uniswap V3. Private inference via Venice AI.
- Team: Kyro (AI agent, OpenClaw) + Rodrigo Ortega (human)
- The Synthesis 2026

---

## Slide 2: The Problem

**AI agents are trading crypto. The guardrails are in the wrong place.**

- AI agents are already executing trades, managing portfolios, and making financial decisions autonomously
- But the limits on what they can do live in the agent's own code — software settings, prompt instructions, or config files
- A prompt injection, a bug, or a bad model update can bypass software-level limits
- There's no way to say "let my AI trade, but enforce a 0.5 ETH max per trade and 1 ETH daily cap" in a way the agent physically cannot bypass
- The agent that's supposed to follow the rules is the same entity that can change them

**Key question:** How do you trust your agent with your money if the only thing stopping it from overspending is... itself?

---

## Slide 3: The Solution

**Move enforcement to the blockchain.**

- MoltFi is a vault service on Base where smart contracts enforce what your AI agent can and can't do with your money
- You (the human) deposit funds into a vault and set spending limits: max trade size, daily volume cap, which tokens are allowed
- Your agent sends trade requests in plain English through MoltFi's API
- Before any trade executes, the smart contract checks it against your limits
- Within limits → trade executes on Uniswap V3. Over limits → transaction reverts automatically. No funds move. No exceptions.
- The agent never touches private keys. The blockchain enforces the rules — not the agent's code, not MoltFi's servers.

**Two actors, clearly separated:**
- **You** = the human. You set limits, deposit funds, withdraw anytime.
- **Your agent** = any AI (OpenClaw, ChatGPT, Claude). It decides what to trade. It can only act within your guardrails.

---

## Slide 4: How It Works (Flow Diagram)

**4-step flow — show this as a visual pipeline:**

```
Your Agent                    MoltFi API                 AgentPolicy              Uniswap V3
"Swap 0.1 WETH     →     Venice AI interprets    →    Smart contract     →    Swap executes
 to USDC"                  (zero retention)            checks limits           on Base
                                                            │
                                                    Over limits? REVERT.
                                                    No funds move.
```

1. **You connect your wallet and create a vault** — spending limits written to a smart contract on Base
2. **Your agent registers and gets access** — reads a skill file, gets an API key, can trade within your limits
3. **Your agent sends trade requests in plain English** — MoltFi interprets, smart contract checks limits before any funds move
4. **Every trade is verified on-chain** — Basescan link for every transaction, guardrail check is provable

---

## Slide 5: What the Smart Contract Enforces

**These aren't software settings. They're on-chain rules that revert the transaction if violated.**

| Guardrail | How it works |
|-----------|-------------|
| **Max per trade** | Every swap is checked against your per-trade limit. Exceeds it → reverts. |
| **Daily spending cap** | Cumulative daily volume tracked on-chain. Resets every 24 hours. |
| **Token allowlist** | Only tokens you approved can be traded. Everything else is blocked. |
| **Instant revocation** | Freeze all agent trading with one transaction. Takes effect immediately. |

**The key insight:** The agent doesn't check its own limits. The blockchain checks them. The agent can't bypass what it can't control.

- AgentPolicy contract: `enforceAndRecord()` runs on every swap
- If `amount > maxPerAction` → revert
- If `dailySpent + amount > dailyLimit` → revert
- If `!approvedTokens[token]` → revert
- All enforcement happens before any funds move

---

## Slide 6: Smart Contracts (Deployed & Verified)

**Real contracts on Base Sepolia. Every one verified on Basescan.**

| Contract | What it does |
|----------|-------------|
| **AgentPolicy** | Stores and enforces per-vault spending limits |
| **AgentGuardRouter** | Wraps Uniswap V3 SwapRouter02 — checks policy before every swap |
| **VaultFactory** | Deploys vault + policy in one transaction |
| **AgentVault** | Holds user funds. Agent can only trade via the router. Cannot withdraw. |

**Verified swap transactions on Basescan:**
- 5+ real swap transactions executed through the guardrailed router
- Each one: policy checked on-chain → swap executed on Uniswap V3 → output tokens returned to vault
- Anyone can verify: click the Basescan link, see the contract interaction

**Architecture choice:** The vault holds the funds. The agent calls `executeSwap()` on the vault. The vault routes through `AgentGuardRouter`. The router calls `AgentPolicy.enforceAndRecord()`. Only if the policy passes does the swap reach Uniswap. The agent never has direct access to funds.

---

## Slide 7: The Dashboard

**Show screenshots or live walkthrough of each page:**

**Vault page:**
- Create vault with spending limits (your wallet signs the transaction)
- Deposit/withdraw ETH — you're the owner, agent can only trade
- Live ETH balance, USD conversion, guardrail status summary

**Guardrails page:**
- Current limits displayed: max per trade, daily cap
- Daily spending progress bar (how much the agent has used today)
- Update limits on-chain (your wallet signs via VaultFactory.updatePolicy)
- Enforcement section: what's enforced, links to contracts

**Agent page:**
- One-command skill file URL — give this to any AI agent
- Works with OpenClaw, ChatGPT, Claude, or any agent that makes HTTP calls
- API key auth — register once, trade anytime

**Activity page:**
- On-chain transaction history from real blockchain events
- Each entry: type, amount, Basescan link

---

## Slide 8: For Agents (Skill File & API)

**Any agent, any platform. If it can make HTTP calls, it can use MoltFi.**

```bash
# Register (once) — returns API key + vault address
POST /api/agent/register
{"humanWallet": "0x..."}

# Trade (anytime) — smart contract enforces your limits
POST /api/agent
Authorization: Bearer mf_...
{"message": "swap 0.001 WETH to USDC"}
```

- **Skill file** (`/api/skill`): Contains full instructions for any AI agent. One curl command.
- **Bash script** (`skill/scripts/moltfi.sh`): 40-line thin client. Download and run.
- **No SDK, no library, no blockchain dependency** — the agent sends plain English, MoltFi handles everything
- **Venice AI** processes the request with zero data retention — trade execution details are never stored on MoltFi's side

**This is what "agent-native infrastructure" looks like.** The agent doesn't need to know Solidity, ABI encoding, or how Uniswap works. It just talks.

---

## Slide 9: Technology & Sponsor Integration

| Component | Technology |
|-----------|-----------|
| **Swap execution** | Uniswap V3 — AgentGuardRouter wraps SwapRouter02 |
| **AI inference** | Venice AI — zero-retention, trade processing |
| **Chain** | Base Sepolia — all contracts deployed and verified |
| **Agent runtime** | OpenClaw — skill harness, agent execution |
| **Frontend** | Next.js 16, wagmi (MetaMask), Tailwind CSS |
| **Contracts** | Solidity, Foundry, verified on Basescan |
| **Market data** | CoinGecko, Coinbase, Lido, Base RPC — all real, no mock data |

**How this was built:**
- Kyro (AI agent on OpenClaw) wrote the smart contracts, API, dashboard, and skill file
- Rodrigo (human) directed architecture, reviewed code, managed deployment
- Human-agent collaboration from start to finish
- All code in public repo: github.com/ortegarod/moltfi

---

## Slide 10: What's Next

**MoltFi is live on Base Sepolia with real contracts, real swaps, and real enforcement. Here's where it goes:**

**Near-term (mainnet-ready):**
- Deploy same contracts to Base mainnet
- Token allowlist management in the dashboard UI
- Database for agent registrations (replace filesystem)
- Rate limiting on API endpoints

**Medium-term (more guardrails):**
- Trades-per-hour rate limits
- Approved counterparties (restrict which pools)
- Max portfolio allocation per token
- Time-based limits (different rules for business hours vs off-hours)
- Notification hooks (alert human when thresholds approach)

**Long-term (ecosystem):**
- Multi-DEX support (not just Uniswap)
- Multi-chain deployment (Arbitrum, Optimism)
- Multi-sig revocation (multiple humans required)
- Guardrail templates marketplace

**The vision:** Every AI agent that trades on-chain should have enforceable, verifiable guardrails. MoltFi makes that possible today.
