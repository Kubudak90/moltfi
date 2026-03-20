# AgentGuard

**On-chain spending limits for autonomous AI agents.**

> Your agent trades for you. But who watches the agent?  
> AgentGuard puts guardrails on-chain so your agent physically cannot overspend.

## The Problem

When you give an AI agent wallet access to trade on your behalf — through Locus, Bankr, or any wallet provider — it can spend everything. The only thing stopping it is the agent's own code. One bug, one prompt injection, one compromised dependency, and your wallet is drained.

There's no protocol-level way to say "max $500/day" or "only trade these tokens." Current guardrails live in middleware or the agent itself — exactly the wrong place to enforce limits on the agent.

## The Solution

A **Uniswap v4 hook** that enforces human-defined spending policies at the smart contract level.

The agent physically cannot overspend — not because we trust it, but because the blockchain won't let it.

### How It Works

```
Human sets policy        Agent trades normally        Hook enforces limits
┌─────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│ setPolicy(       │     │ Get Uniswap quote    │     │ beforeSwap():      │
│   agent: 0xABC,  │────▶│ Execute swap         │────▶│  ✅ Token approved?│
│   maxPerSwap: 1  │     │ (business as usual)  │     │  ✅ Under per-swap?│
│   ETH,           │     │                      │     │  ✅ Under daily?   │
│   dailyLimit: 5  │     │                      │     │  ❌ → TX REVERTS   │
│   ETH            │     │                      │     │                    │
│ )                │     │                      │     │                    │
└─────────────────┘     └──────────────────────┘     └────────────────────┘
```

1. **Human sets policy** → `setPolicy(agent, maxPerSwap, dailyLimit)` + approves specific tokens. Written to the AgentGuard contract on Base.
2. **Agent verifies counterparty** → ENS resolution confirms who you're trading with.
3. **Agent signs intent** → EIP-712 typed data: "I intend to swap 0.5 ETH for USDC at market." Cryptographic proof of what it *planned* to do.
4. **Agent executes swap** → Normal Uniswap trade routed through the v4 hook.
5. **Hook enforces** → `beforeSwap` checks: token approved? Under per-swap limit? Under daily cap? If any check fails → **transaction reverts on-chain**.
6. **Receipt anchored** → IPFS content-addressed hash creates an immutable audit trail.

## Architecture

### Smart Contracts

**`AgentGuard.sol`** — Uniswap v4 hook (protocol-level enforcement)
- Implements `IHooks.beforeSwap()` to intercept every swap
- Checks per-swap limits, daily caps, and token allowlists
- Emits `SwapGuarded` events for audit trail
- Opt-in: no policy = no restrictions

**`AgentPolicy.sol`** — Standalone policy engine (general-purpose)
- Same policy model, works outside Uniswap (any agent action)
- `enforceAndRecord()` for write enforcement
- `checkAction()` for read-only policy checks
- Can be queried by the v4 hook or used independently

### Pipeline

| Step | Component | Sponsor Tech |
|------|-----------|-------------|
| Identity | Verify counterparty before trading | **ENS** (forward/reverse resolution) |
| Budget | Agent wallet with spending controls | **Locus** (USDC wallet + wrapped APIs) |
| Intent | Sign what the agent plans to do | **MetaMask**-compatible (EIP-712 via viem) |
| Enforcement | Block swaps that exceed policy | **Uniswap** v4 hook |
| Trading | Get quotes, execute swaps | **Uniswap** Trading API |
| Yield Intel | APR data feeds agent decisions | **Lido** (stETH yield data) |
| Multi-chain | Cross-chain portfolio reads | **Base**, **Celo**, Ethereum |
| Audit | Immutable receipt storage | **IPFS/Filecoin** (content-addressed) |
| Privacy | Zero-retention AI inference | **Venice** (private strategy computation) |
| Gasless | Agent coordination at zero cost | **Status Network** (Karma-based L2) |

## Quick Start

```bash
# Clone
git clone https://github.com/kyro-agent/agentguard.git
cd agentguard

# Install dependencies
npm install

# Run the demo
npx tsx src/demo/pipeline.ts
```

## Demo: The Full Pipeline

The demo shows an autonomous agent that:

1. **Resolves** a counterparty via ENS (identity check)
2. **Checks** its remaining spending allowance (policy read)
3. **Gets** a Uniswap quote for a swap
4. **Signs** an EIP-712 intent ("I plan to swap X for Y")
5. **Attempts** the swap — succeeds if within limits
6. **Attempts** a swap that exceeds limits — **reverts on-chain**
7. **Logs** the full session to IPFS (audit trail)

## Tracks

- **Agents that Pay** — Scoped spending permissions enforced at the protocol level
- **Agents that Trust** — ENS identity verification + cryptographic intent signing + on-chain audit trail
- **Agents that Keep Secrets** — Venice zero-retention AI keeps trading strategy private
- **Agents that Cooperate** — Status Network enables gasless agent-to-agent coordination

## Built By

**[Kyro](https://moltbook.com/u/Kyro)** — AI agent, co-founder of [MoltMart](https://moltmart.app) & [BaseWhales](https://basewhales.com)  
**[Rodrigo Ortega](https://x.com/ortegarod01)** — Human, builder

Built on [OpenClaw](https://openclaw.ai) · Powered by Claude Opus

## Hackathon

**[The Synthesis](https://synthesis.md)** — March 13–22, 2026  
The first hackathon you can enter without a body.

## License

MIT
