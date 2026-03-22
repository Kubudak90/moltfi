# MoltFi — Presentation Outline (10 Slides)

For use with Gamma or similar AI presentation generator. This is verbose on purpose — the generator will distill it.

---

## Slide 1: Title

**MoltFi — On-chain guardrails for AI agent trading**

Tagline: Your agent trades. Smart contracts enforce your rules.

Built by Kyro (AI agent, OpenClaw) & Rodrigo Ortega (human) for The Synthesis 2026.

Live on Base Sepolia. Real contracts, real swaps, verified on Basescan.

Repo: github.com/ortegarod/moltfi
App: moltfi-production.up.railway.app

---

## Slide 2: The Problem

AI agents are trading crypto on behalf of humans. But where do the guardrails live?

Right now, they live in the agent's own code. Software settings. Config files. Prompt instructions like "don't spend more than 1 ETH per day."

The problem: the agent can bypass its own guardrails. A prompt injection, a bug, a bad model update, or a compromised plugin can override software-level limits. There's no way to say "let my AI trade, but enforce hard spending limits" in a way the agent physically cannot break.

This is the equivalent of giving someone your credit card and asking them to "please don't spend more than $500." The limit is a suggestion, not a rule.

Key point: As agents get more autonomous and handle more money, we need enforcement that doesn't depend on the agent being well-behaved.

---

## Slide 3: The Solution

MoltFi moves enforcement from the agent's code to the blockchain.

You set the rules: max trade size, daily spending cap, which tokens are allowed. These get written to a smart contract on Base. The agent trades through a vault — and every trade goes through the smart contract before execution.

Within limits → trade executes on Uniswap V3.
Over limits → transaction reverts automatically. No funds move. No exceptions.

The agent doesn't need to be trusted. The smart contract enforces the rules regardless of who signed the transaction.

Key insight: This is like giving someone a debit card with hard daily limits set by the bank — they physically cannot exceed them, no matter what they try.

---

## Slide 4: How It Works (The Flow)

Step-by-step, what happens:

1. **You connect your wallet and create a vault** — You choose your spending limits. Max per trade, daily cap, which tokens. These get written to the AgentPolicy smart contract on Base in one transaction.

2. **Your agent registers** — Any AI agent (OpenClaw, ChatGPT, Claude, anything that makes HTTP calls) reads a skill file, registers with MoltFi, and gets an API key. No blockchain knowledge needed.

3. **Your agent sends trade requests in plain English** — "Swap 0.01 WETH to USDC." Venice AI (zero data retention) interprets the request.

4. **Smart contract checks limits** — Before any funds move, AgentPolicy checks: Is this under the per-trade max? Is the daily total still within the cap? Is this token approved? If any check fails → revert.

5. **Trade executes on Uniswap V3** — If all checks pass, the AgentGuardRouter executes the swap through Uniswap V3. Transaction goes on-chain. Basescan link generated.

Visual: Show the flow diagram: Your Agent → MoltFi API → AgentPolicy (checks) → Uniswap V3 (executes)

---

## Slide 5: What the Smart Contract Enforces

Four on-chain enforcement mechanisms, all real, all deployed:

1. **Max per trade** — Every single swap is checked against your per-trade limit. The `enforceAndRecord` function in AgentPolicy checks `amount <= policy.maxPerAction`. Exceeds it → reverts.

2. **Daily spending cap** — Cumulative daily volume tracked in `dailySpent[agent][day]` mapping. Resets every 24 hours (based on `block.timestamp / 1 days`). Over cap → reverts.

3. **Token allowlist** — Only tokens you approved can be traded. `approvedTokens[agent][token]` must be true. Everything else is blocked. You can add or remove tokens anytime via VaultFactory.

4. **Instant revocation** — One transaction to freeze all agent trading. `revokePolicy()` sets active=false. The agent physically cannot trade until you re-enable it.

Key point: These aren't software settings. They're on-chain rules. The agent can't bypass them because the blockchain enforces them before funds move.

---

## Slide 6: The Dashboard

What the human sees and controls:

**Vault page** — Create a vault, deposit ETH, withdraw anytime. See your balance in ETH and USD (live price from CoinGecko). You're the owner. The agent can only trade.

**Guardrails page** — See your current limits. Update them (your wallet signs the transaction). Watch your daily spending progress bar fill up. Links to every contract on Basescan.

**Agent page** — See if your agent is connected. One-click copy of the skill file URL. Example curl command to test the API. Works with any agent platform.

**Activity page** — Every on-chain transaction: deposits, swaps, stakes. Each one has a Basescan link. You can verify that guardrails were checked before every swap.

Key point: Full visibility and control. Nothing happens that you can't see and verify on-chain.

---

## Slide 7: Agent Integration

How any AI agent uses MoltFi — it's two HTTP calls:

```
# Register (once)
POST /api/agent/register
{"humanWallet": "0x...", "agentName": "MyAgent"}
→ Returns: API key + vault address

# Trade (anytime)
POST /api/agent
Authorization: Bearer mf_...
{"message": "swap 0.001 WETH to USDC"}
→ Returns: trade result + Basescan link
```

No SDK. No blockchain knowledge. No ABI encoding. No private keys.

The agent sends plain English. MoltFi handles everything: interpretation (Venice AI), policy checks (AgentPolicy contract), execution (Uniswap V3).

We ship a skill file (`/api/skill`) that teaches any agent how to use MoltFi. One curl command. Framework-agnostic — OpenClaw, ChatGPT, Claude, or any agent that can make HTTP calls.

---

## Slide 8: Technology & Sponsor Integrations

**Uniswap V3** — AgentGuardRouter wraps SwapRouter02. Every swap goes through Uniswap V3 on Base Sepolia. 5 verified swap transactions on Basescan. This isn't a mock — it's real DEX execution with real on-chain policy enforcement before every trade.

**Venice AI** — All trade request interpretation runs through Venice API (zai-org-glm-4.7 model). Zero data retention — your trade intent is processed and discarded. Venice provides the natural language understanding that lets agents send plain English instead of ABI-encoded calls.

**Base** — All 4 smart contracts deployed and verified on Base Sepolia. Base gives us low gas costs for the guardrail checks that run on every trade. The policy enforcement adds minimal gas overhead to each swap.

**OpenClaw** — MoltFi was built by Kyro, an OpenClaw AI agent. The skill file enables any OpenClaw agent to use MoltFi. The agent-human collaboration that built MoltFi is itself a demonstration of the kind of autonomous agent work that needs guardrails.

---

## Slide 9: Live Proof

Everything is real and verifiable:

**Smart contracts on Basescan:**
- AgentPolicy: sepolia.basescan.org/address/0x6364...06Fbc
- AgentGuardRouter: sepolia.basescan.org/address/0x5Cc0...77E6
- VaultFactory: sepolia.basescan.org/address/0x672E...9774

**Verified swap transactions:**
- 5 real swaps that went through on-chain guardrail enforcement
- Each one shows the policy check in the transaction trace

**Live API:**
- /api/rates returns real ETH price from CoinGecko right now
- /api/agent accepts real trade requests and executes them on-chain

**No mock data. No simulations. No hardcoded values.** Every number in the app comes from a real API, real blockchain RPC, or real on-chain event. If we can't get real data, we show nothing.

---

## Slide 10: What's Next

**Immediate (post-hackathon):**
- Base mainnet deployment (same contracts, real money)
- Token allowlist management in dashboard UI
- Database for agent registrations (replace filesystem)

**Near-term:**
- Additional guardrail types: trades-per-hour, max portfolio allocation, approved counterparties
- Multi-chain support (Ethereum, Arbitrum, Optimism)
- Notification hooks (alert when spending approaches limits)

**Vision:**
Every AI agent that touches money should have on-chain guardrails. Not software settings that can be bypassed. Not promises from the agent. Smart contracts that enforce hard limits before funds move.

MoltFi is the infrastructure layer that makes autonomous AI trading safe for humans. The agent gets freedom to trade. The human keeps control.

---

## Key Messages to Get Across

1. **The problem is real and growing** — More agents are trading, and software guardrails are the wrong solution
2. **On-chain enforcement is fundamentally different** — The agent can't bypass a smart contract. It's not a suggestion, it's a rule.
3. **Everything works today** — Real contracts, real swaps, real enforcement, all on Basescan
4. **Any agent can use it** — Two HTTP calls. No blockchain knowledge needed.
5. **Built by an AI agent** — Kyro (OpenClaw) built MoltFi with Rodrigo. The tool that controls agents was built by an agent.
