# AgentGuard Web — AI Vault Manager

## What This Is

A web dashboard for managing DeFi positions through an AI agent with on-chain guardrails.
Think: personal AI financial advisor with blockchain-enforced spending limits.

## Architecture

- **Next.js 16** app with Tailwind CSS v4
- **viem** for all blockchain reads (Base Sepolia)
- **No wallet connect library** — we read on-chain state directly via public RPC
- **No mock data** — every number comes from a real source or shows "—"

## Deployed Contracts (Base Sepolia)

- **AgentPolicy**: `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc`
- **AgentGuardRouter**: `0x056C1cEC49b335a31247506d30fE36B063cf8B84`
- **Base Sepolia RPC**: `https://sepolia.base.org`

## AgentPolicy ABI (key functions to read)

```solidity
// Read policy for a human→agent pair
function policies(address human, address agent) returns (uint256 maxPerAction, uint256 dailyLimit, bool active)

// Read daily spending
function dailySpent(address agent, uint256 day) returns (uint256)

// Read agent owner
function agentOwner(address agent) returns (address)

// Check if token approved
function approvedTokens(address agent, address token) returns (bool)
```

## What To Build

### Three screens, one app:

### 1. Landing / Onboarding (`/`)
A clean landing page that explains the product, then a simple onboarding flow:
- **Hero section**: "Your AI Vault Manager" — manage DeFi with AI, protected by on-chain guardrails
- **How it works**: 3 steps visual (Set Strategy → Agent Executes → You Monitor)
- **Get Started button** → scrolls/navigates to the onboarding form

**Onboarding form** (single page, not multi-step wizard):
- Risk tolerance: Conservative / Moderate / Aggressive (radio/card selector)
- Goal: Preserve Capital / Generate Yield / Growth (radio/card selector)  
- Max trade size: input field (in ETH)
- Daily volume limit: input field (in ETH)
- A "Review Strategy" button that shows what the agent would do based on selections
- Strategy preview: based on risk+goal, show proposed allocation (e.g., "50% Lido staking, 30% USDC lending, 20% liquid")
- Note: This is a demo — the form doesn't need to actually write to chain. It should demonstrate the UX flow.

### 2. Dashboard (`/dashboard`)
The main management view after onboarding:

**Portfolio section:**
- Read real ETH balance for a demo agent address (use `0x90d9c75f3761c02Bf3d892A701846F6323e9112D` as the demo agent)
- Show current positions: ETH balance (from chain), with placeholder sections for "Lido Staking" and "USDC Lending" showing "Not active" or "Connect to activate"
- Total portfolio value in USD — use CoinGecko API: `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`

**Strategy section:**
- Show the current active strategy (hardcode a reasonable default for demo: "Moderate Risk / Generate Yield")
- Show allocation targets as a simple bar or list
- "Edit Strategy" button (can just scroll back to onboarding form for MVP)

**Guardrails section:**
- Read REAL on-chain data from AgentPolicy contract:
  - `policies(humanAddress, agentAddress)` → maxPerAction, dailyLimit, active
  - `dailySpent(agentAddress, currentDay)` → today's usage
- Display: Max per trade, Daily limit, Today's usage, Status (active/inactive)
- Use human address: `0x90d9c75f3761c02Bf3d892A701846F6323e9112D` and agent address: `0x90d9c75f3761c02Bf3d892A701846F6323e9112D` (same for demo — it set policy on itself)

**Day calculation for dailySpent:** `Math.floor(Date.now() / 1000 / 86400)` — this matches the Solidity `block.timestamp / 1 days`

### 3. Activity Log (`/activity`)
- For MVP: Show a clean activity log UI with a message "Agent not yet active — activity will appear here once your agent starts executing"
- Design the log entry cards: timestamp, action description, tx hash (linked to Basescan), reasoning, status (success/failed/pending)
- Include 0 entries — do NOT create fake/mock entries

## Design Guidelines

- **Dark theme** — dark zinc/slate background, clean modern look
- **Color accents**: Blue for primary actions, green for success/positive, red for warnings/limits
- **Typography**: Clean, modern. Use Inter or system fonts.
- **Cards**: Rounded corners, subtle borders, no heavy shadows
- **Responsive**: Mobile-friendly but desktop-first
- **Navigation**: Simple top nav with logo + Dashboard / Activity links
- **Product name**: "AgentGuard" with tagline "AI Vault Manager"

## Critical Rules

1. **NO MOCK DATA** — Every number displayed must come from a real API or chain call. If you can't fetch it, show "—" or "unavailable". NEVER hardcode prices, balances, or transaction hashes.
2. **NO fake activity entries** — The activity log starts empty. That's fine.
3. **Real chain reads via viem** — Use `createPublicClient` with Base Sepolia transport
4. **CoinGecko for prices** — `https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd` (free, no API key)
5. **Error states** — If an API call fails, show an error state, not a fallback fake number
6. **Keep it simple** — 3 screens, clean UI. No feature creep.

## File Structure

```
app/
  layout.tsx        — Root layout with nav
  page.tsx          — Landing + onboarding
  dashboard/
    page.tsx        — Portfolio + strategy + guardrails
  activity/
    page.tsx        — Activity log
  components/
    Nav.tsx         — Top navigation
    PortfolioCard.tsx
    GuardrailsCard.tsx
    StrategyCard.tsx
    OnboardingForm.tsx
    ActivityEntry.tsx
  lib/
    contracts.ts    — Contract addresses, ABIs, viem client setup
    types.ts        — TypeScript types
```

## Tech Notes

- This is Next.js 16 with App Router
- Tailwind CSS v4 (use `@import "tailwindcss"` in globals.css, not the old @tailwind directives)
- Use `"use client"` for components that need useState/useEffect/browser APIs
- viem is already installed — use it for all chain reads
- No additional packages needed — keep deps minimal
