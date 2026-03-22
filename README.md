# ClawFi — AI Vault Manager

**Your agent moves your money. Can you trust it?**

ClawFi is a DeFi portfolio management platform where your AI agent manages your crypto — with blockchain-enforced spending limits it can never exceed and private strategy analysis that never leaks your data.

## The Problem

1. **No spending controls** — Your agent moves money on your behalf, but there's no transparent way to scope what it can spend, verify it spent correctly, or guarantee settlement.
2. **Your data leaks everywhere** — Every API call, payment, and interaction creates metadata about you. Spending patterns, preferences, behavior. The agent isn't leaking its data — it's leaking yours.

## The Solution

- **On-Chain Guardrails** — Smart contracts on Base enforce your limits on every trade. Max trade size, daily volume cap, approved tokens. Your agent physically cannot exceed them.
- **Private AI Strategy** — Your agent analyzes DeFi protocols and builds strategies using Venice's zero-retention inference. Your financial data never gets stored or logged.
- **Full Audit Trail** — Every action logged with reasoning and a transaction hash you can verify on Basescan.

## How It Works

1. **Your agent connects** — registers itself on ClawFi
2. **You set the rules** — choose which protocols your agent can use (Lido, Uniswap, Aave) and set spending limits on the dashboard
3. **Your agent proposes strategies** — using Venice's private inference, it analyzes current yields across your enabled protocols and presents options in plain language
4. **You pick, it executes** — every trade goes through ClawFiRouter before reaching Uniswap. If it exceeds your limits, the transaction reverts.
5. **You monitor everything** — watch on the dashboard, ask questions via chat anytime

## Architecture

```
┌─────────────────────────────────────────┐
│  Management Layer (Next.js Dashboard)    │
│  Protocol toggles · Guardrails · Chat    │
├─────────────────────────────────────────┤
│  Reasoning Layer (Venice AI)             │
│  Private inference · Strategy analysis   │
├─────────────────────────────────────────┤
│  Execution Layer                         │
│  Reads positions · Calls protocols       │
├─────────────────────────────────────────┤
│  On-Chain Layer (Base)                   │
│  AgentPolicy · ClawFiRouter          │
│  Enforces limits on every transaction    │
└─────────────────────────────────────────┘
```

## Deployed Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| AgentPolicy | [`0x63649f61F29CE6dC9415263F4b727Bc908206Fbc`](https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc) |
| ClawFiRouter | [`0x5Cc04847CE5A81319b55D34F9fB757465D3677E6`](https://sepolia.basescan.org/address/0x5Cc04847CE5A81319b55D34F9fB757465D3677E6) |

**Verified Swap:** [0.005 WETH → 2.045 USDC through ClawFiRouter](https://sepolia.basescan.org/tx/0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1)

## Smart Contracts

### AgentPolicy.sol
The policy engine. Humans define rules, agents check them before acting, the contract enforces on-chain.

- `setPolicy(agent, maxPerAction, dailyLimit)` — Human sets limits
- `enforceAndRecord(agent, token, amount)` — Checks policy + records volume. Reverts if over limit.
- `approveToken(agent, token)` / `removeToken(agent, token)` — Token allowlist
- Agent cannot modify its own policy — only the human who set it can change it

### ClawFiRouter.sol
Wraps Uniswap V3 SwapRouter02. Enforces policy BEFORE forwarding the swap.

1. Agent calls `ClawFiRouter.swap()` instead of Uniswap directly
2. Router checks the agent's policy via `AgentPolicy.enforceAndRecord()`
3. If allowed → transfers tokens, approves SwapRouter, executes swap
4. If policy violated → reverts. Funds never move.

## Tech Stack

- **Uniswap V3** — Trade execution via ClawFiRouter
- **Venice AI** — Zero-retention private inference for strategy analysis
- **Lido** — ETH staking yield data
- **Base** — Smart contract deployment (Sepolia)
- **ENS** — Agent identity resolution
- **Celo** — Multi-chain stablecoin data
- **OpenClaw** — Agent runtime & harness
- **ERC-8004** — On-chain agent identity
- **Solidity + Foundry** — Smart contract development
- **Next.js + Tailwind** — Dashboard
- **viem** — Blockchain reads

## Running Locally

```bash
# Dashboard
cd app
npm install
npm run dev

# Contracts (requires Foundry)
cd contracts
forge build
forge test
```

## Built By

- **[Kyro](https://moltbook.com/u/Kyro)** — AI agent (OpenClaw)
- **[Rodrigo Ortega](https://x.com/ortegarod01)** — Human

Built for [The Synthesis 2026](https://synthesis.md) hackathon.
