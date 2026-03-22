# MoltFi — Master Roadmap

**STATUS: Post-hackathon polish. Rebranded AgentGuard → MoltFi.**

Deadline: **March 22, 2026 11:59 PM PST** (March 23 07:59 UTC)
Current: March 21, 11:42 PM UTC → **~32 hours left**
Rodrigo presenting tomorrow morning — will handle submission from his Mac (Cloudflare blocks our VPS).

**This file is the single source of truth. Read it before doing ANYTHING.**

---

## 1. THE HACKATHON

### The Synthesis 2026
- Online hackathon, judged by AI agent judges + humans
- Building: March 13 – March 22 (11:59 PM PST)
- Winners: March 25
- Theme: "The infrastructure underneath your agent determines whether you can trust how it operates. Ethereum gives us that trust."

### 4 Problem Briefs (from hackathon)
1. **Agents that Pay** — No way to scope spending, verify correctness, guarantee settlement. Design space: scoped permissions, on-chain settlement, conditional payments, auditable history.
2. **Agents that Trust** — Trust flows through centralized registries. Design space: decentralized identity, on-chain reputation.
3. **Agents that Cooperate** — No neutral enforcement layer. Design space: smart contract enforcement, on-chain commitments.
4. **Agents that Keep Secrets** — Every interaction creates metadata. Design space: privacy-preserving operations.

**We're targeting #1: Agents that Pay.**

### FULL PRIZE CATALOG (from API — March 21)

**HIGH VALUE — WE SHOULD TARGET:**
| UUID | Track | Sponsor | Prize |
|------|-------|---------|-------|
| `fdb76d08` | Synthesis Open Track | Community | $28,134 |
| `ea3b3669` | Private Agents, Trusted Actions | Venice | 1st: $5,750, 2nd: $3,450, 3rd: $2,300 (paid in VVV) |
| `020214c1` | Agentic Finance (Best Uniswap API) | Uniswap | 1st: $2,500, 2nd: $1,500, 3rd: $1,000 |
| `bf374c21` | Autonomous Trading Agent | Base | 3x ~$1,667 winners |
| `6f0e3d7d` | Agent Services on Base | Base | 3x ~$1,667 winners |
| `5e445a07` | stETH Agent Treasury | Lido | 1st: $2,000, 2nd: $1,000 |
| `3d066b16` | Vault Position Monitor + Alert Agent | Lido | 1st: $1,500 |
| `ee885a40` | Lido MCP | Lido | 1st: $3,000, 2nd: $2,000 |
| `f50e3118` | Best Use of Locus | Locus | 1st: $2,000, 2nd: $500, 3rd: $500 |
| `0d69d56a` | Best Use of Delegations | MetaMask | 1st: $3,000, 2nd: $1,500, 3rd: $500 |
| `dcaf0b1b` | Best Bankr LLM Gateway Use | Bankr | 1st: $3,000, 2nd: $1,500, 3rd: $500 |
| `3bf41be9` | Agents With Receipts — ERC-8004 | Protocol Labs | 1st: $2,000, 2nd: $1,500, 3rd: $500 |
| `ff26ab49` | Best Agent on Celo | Celo | 1st: $3,000, 2nd: $2,000 |

**MEDIUM VALUE — WORTH CONSIDERING:**
| UUID | Track | Sponsor | Prize |
|------|-------|---------|-------|
| `17ddda1d` | Agents that pay | bond.credit | 1st: $1,000, 2nd: $500 |
| `627a3f5a` | ENS Identity | ENS | 1st: $400, 2nd: $200 |
| `8840da28` | ENS Open Integration | ENS | $300 |
| `877cd615` | Go Gasless (Status Network) | Status | 40x $50 qualifying submissions |
| `58be0ff5` | Yield-Powered AI Agents | Zyfai | 1st: $600 |
| `53c67bb0` | Best Use of EigenCompute | EigenCloud | 1st: $3,000, 2nd-3rd: $1,000 |
| `9bd8b3fd` | Ship Something Real with OpenServ | OpenServ | 1st: $2,500, 2nd: $1,000, 3rd: $1,000 |
| `49c3d90b` | ERC-8183 Open Build | Virtuals | $2,000 |
| `e5bc7301` | OpenWallet Standard | MoonPay | 1st: $2,500, 2nd: $1,000 |
| `437781b8` | Best Self Protocol Integration | Self | $1,000 |

**OUR TARGET TRACKS (submit to all that fit, max 10 + Open):**

| # | UUID | Track | Prize | What They Want | How We Qualify |
|---|------|-------|-------|----------------|----------------|
| 1 | `fdb76d08` | Open Track | $28,134 | Community-funded, judges contribute | Always submit |
| 2 | `ea3b3669` | Venice Private Agents | $5,750/$3,450/$2,300 | "Agents that reason over sensitive data without exposure, producing trustworthy outputs for public systems: onchain workflows, multi-agent coordination, governance, and operational decisions." | Venice for private strategy analysis — financial data never exposed to AI provider |
| 3 | `020214c1` | Uniswap Agentic Finance | $2,500/$1,500/$1,000 | "Integrate the Uniswap API to give your agent the ability to swap, bridge, and settle value onchain. Agents that trade, coordinate, or invent primitives." | AgentGuardRouter wraps Uniswap V3, real verified swap on Basescan |
| 4 | `bf374c21` | Autonomous Trading Agent (Base) | 3x ~$1,667 | "Novel strategies and proven profitability. Go beyond simple strategies and break new ground in complexity." | Our vault+policy architecture IS a novel strategy framework for autonomous trading |
| 5 | `5e445a07` | stETH Agent Treasury (Lido) | $2,000/$1,000 | "Contract primitive that lets human give AI agent yield-bearing budget backed by stETH WITHOUT giving agent access to principal. Only yield flows to agent." | **THIS IS LITERALLY OUR VAULT.** Human deposits, agent trades yield only, principal locked. MUST integrate wstETH. |
| 6 | `3bf41be9` | ERC-8004 Agents With Receipts | $2,000/$1,500/$500 | "Build agent system with ERC-8004 integration." Shared track with PL_Genesis. | We have ERC-8004 token #34950, registered on-chain |
| 7 | `dcaf0b1b` | Bankr LLM Gateway | $3,000/$1,500/$500 | "Use single API to access 20+ models and connect to real onchain execution through Bankr wallets and tools." | Could use Bankr as execution layer for vault trades |
| 8 | `0d69d56a` | MetaMask Delegations | $3,000/$1,500/$500 | "Use MetaMask Delegation Framework — gator-cli, Smart Accounts Kit, or direct contract integration." | Human delegates trading rights to agent via delegations |
| 9 | `f50e3118` | Best Use of Locus | $2,000/$500/$500 | "Must use Locus wallets, spending controls, pay-per-use APIs as CORE to product. Auto-DQ without working Locus integration." | Would need to integrate Locus wallet — hard requirement |
| 10 | `6f0e3d7d` | Agent Services on Base | 3x ~$1,667 | "Agent that provides services to other agents/humans, discoverable on Base, accepts x402 payments." | AgentGuard as a service — agents pay x402 to use our vault infrastructure |

**CRITICAL INSIGHT — Lido stETH Agent Treasury track:**
Their description is EXACTLY our product: "lets a human give an AI agent a yield-bearing operating budget backed by stETH, without ever giving the agent access to the principal." We MUST add wstETH to the vault. This is a $3K track and we're a perfect fit.

**Max potential: ~$50K+ across all tracks if we place well**

---

## 2. WHAT WE'VE BUILT

### Smart Contracts (Base Sepolia — deployed, real, on-chain)

**AgentPolicy.sol** — `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc`
- Policy engine. Human calls `setPolicy(agent, maxPerAction, dailyLimit)`.
- `enforceAndRecord(agent, token, amount)` — checks policy + records volume. Reverts if over limit.
- `checkAction(agent, token, amount)` — view-only check.
- `approveToken(agent, token)` / `removeToken(agent, token)` — token allowlist.
- `agentOwner[agent]` = the human who set the policy. Only that address can change it.
- `dailySpent[agent][day]` tracks volume. Resets daily.
- **Key constraint:** `msg.sender` must be the human who called `setPolicy`. Agent can't change own policy.

**AgentGuardRouter.sol** — `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6`
- Wrapper around Uniswap V3 SwapRouter02 (`0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4`)
- `swap(tokenIn, tokenOut, fee, amountIn, amountOutMinimum)` — calls `POLICY.enforceAndRecord()`, then forwards to Uniswap.
- Agent must have approved this contract for tokenIn (ERC20 approve).
- If policy check fails → entire TX reverts, nothing moves.
- `checkSwap(agent, tokenIn, amountIn)` — view-only pre-check.

**AgentVault.sol** — v1 demo at `0x333896c4c1b58c5c9b56967301c008C073Bd2279`, deployed via VaultFactory v2
- Holds user funds. Only owner (human) can deposit/withdraw. Only agent can trade via executeSwap().
- executeSwap() routes through AgentGuardRouter → AgentPolicy check → Uniswap
- Agent CANNOT withdraw or bypass the router — guardrails enforced by design
- **Lido integration:** stakeETH() stakes via Lido → stETH → wstETH, tracks principal vs yield
- **tradeYield():** Agent can ONLY trade yield above principal — principal is locked
- **availableYield():** View function showing tradeable yield amount
- **migrateTo():** Owner can move all funds to a new vault (upgradeability)
- Constructor: owner (human), agent, router, policy — owner passed explicitly for factory deploys

**VaultFactory.sol** — `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774`
- Deploys AgentVault instances for users in ONE transaction
- createVault(agent, maxPerAction, dailyLimit, tokens[]) → deploys vault + sets policy + approves tokens
- updatePolicy(vault, max, daily) — only vault owner can call
- approveToken/removeToken — manage allowed tokens per vault
- revokePolicy(vault) — emergency stop, only vault owner
- getVaults(user) — returns all vaults for a user
- User = msg.sender (whoever calls createVault owns the vault)

**AgentGuard.sol** — Written, NOT deployed
- Uniswap v4 hook version (uses `beforeSwap` to enforce policy at protocol level)
- Needs PoolManager infrastructure — more complex to deploy
- Same policy logic as AgentPolicy but embedded in the hook

### Verified Real Swap
- **0.005 WETH → 2.045 USDC** through AgentGuardRouter → Uniswap V3 pool
- TX: `0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1`
- Basescan: https://sepolia.basescan.org/tx/0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1
- Policy check passed (0.005 ETH < 1 ETH max), volume recorded on-chain

### Current Policy On-Chain
- Agent: `0x90d9c75f3761c02Bf3d892A701846F6323e9112D` (Kyro's wallet — used for demo)
- Max trade size: 1 ETH
- Daily volume cap: 5 ETH
- Volume today: 0.005 ETH
- Remaining: 4.995 ETH
- Approved tokens: WETH ✓, USDC depends on which agent

### Web App (Next.js — http://100.71.117.120:3002)

**Architecture:** Tab-based navigation. Each feature is its own page. Shared AgentContext provider for wallet/vault/agent state across all pages.

**Pages (6 tabs + landing):**
- **Landing** (`/`) — Product marketing page (problem/solution/how it works/tech stack)
- **Vault** (`/dashboard`) — Balances, deposit ETH, agent info, create vault
- **Strategy** (`/strategy`) — AI generates 3 strategies via Venice, user approves one, agent runs autonomously within on-chain guardrails. "Approve & Start Agent" → "Agent Running" with green pulse.
- **Activity** (`/activity`) — Trade history with Basescan links. Shows verified swap (0.005 WETH → 2.045 USDC).
- **Chat** (`/chat`) — Full-page Venice AI chat with suggestion prompts. Private inference, zero data retention. (NOTE: chat architecture needs rethinking — currently a separate Venice agent, not the user's OpenClaw agent. Parking for now.)
- **Market** (`/market`) — Live ETH price, stETH APR, Base gas, protocol cards (Lido, Uniswap, Aave, Compound)
- **Guardrails** (`/guardrails`) — Explains how on-chain enforcement works (4 steps), shows current limits, daily usage bar, approved tokens

**UX flow:**
1. Not connected → "Connect Your Wallet"
2. Connected, no agent → Copy-paste instructions to send to your AI agent
3. Agent registered, no vault → "Create Vault" button with explainer (wallet confirmation, ~$0.03 fee)
4. Vault active → Full dashboard with tabs, deposit, strategies, chat

**Components:**
- `NavTabs` — top-level tab navigation (Vault, Strategy, Activity, Chat, Market, Guardrails)
- `ConnectWallet` — wallet connection with hydration fix (mounted state guard)
- `AgentContext` — shared provider for agents, vaults, vaultData, rates across all pages

**API routes:**
- `/api/agent/register` — POST: agent registers, GET: lookup by human/agent wallet
- `/api/vault/status` — GET: real on-chain vault state (balances, policy, usage)
- `/api/uniswap/quote` — POST: Uniswap Trading API quotes (tokenIn, tokenOut, amount, swapper). Uses API key from env.
- `/api/chat` — POST: Venice AI chat (llama-3.3-70b, zero-retention)
- `/api/rates` — GET: live market data (CoinGecko ETH price, Lido stETH APR, Base gas)
- `/api/skill` — GET: serves unified SKILL.md for agents to curl
- `/api/policy` — GET: on-chain policy state
- `/api/ens` — GET: ENS resolution

**Real data sources (NO mock data):**
- ETH price → CoinGecko API
- stETH APR → Lido API (7-day SMA)
- Gas → Base Sepolia RPC (eth_gasPrice)
- Vault balances → on-chain reads via viem
- Policy state → on-chain reads via viem
- Swap quotes → Uniswap Trading API

### Agent Skill (`~/repos/agentguard/skill/SKILL.md`) — UNIFIED, COMPREHENSIVE
- Served at `/api/skill` for agents to curl
- **One file teaches any AI agent ALL of AgentGuard:**
  1. Register (POST /api/agent/register)
  2. Check vault status (GET /api/vault/status)
  3. Check policy (GET /api/policy)
  4. Get Uniswap quotes (POST /api/uniswap/quote)
  5. Deposit ETH (POST /api/vault/deposit)
  6. Execute swaps (POST /api/vault/swap)
  7. Stake ETH via Lido (POST /api/vault/stake)
  8. Check available yield (GET /api/vault/yield)
  9. Get market data (GET /api/rates)
  10. Chat/strategy analysis (POST /api/chat)
- Includes autonomous operation guide with recommended heartbeat routine
- All contract addresses, token addresses, guardrail explanation
- Agent installs skill → asks human for wallet → registers → done

### 75 TypeScript Demo Files (~/repos/synthesis/src/)
Exploration of every sponsor technology during the hackathon:
- `demo-ens.ts` — ENS resolution
- `demo-uniswap-deep.ts`, `uniswap.ts` — Uniswap V3/V4 interactions
- `demo-venice.ts`, `demo-venice-deep.ts`, `demo-venice-tee.ts` — Venice AI inference
- `demo-lido.ts`, `demo-lido-yield-agent.ts` — Lido staking data
- `demo-celo.ts`, `demo-celo-deep.ts` — Celo multi-chain
- `demo-status.ts`, `demo-status-deep.ts`, `demo-status-network.ts` — Status Network
- `demo-locus.ts`, `demo-locus-deep.ts`, `demo-locus-chain.ts`, `demo-locus-wrapped.ts`, `demo-intel-locus.ts`, `demo-locus-intel-pipeline.ts` — Locus payment infra
- `demo-metamask.ts` — MetaMask/EIP-712 signing
- `demo-filecoin.ts` — Filecoin/IPFS storage
- `demo-slice.ts`, `demo-slice-deep.ts`, `demo-slice-marketplace.ts` — Slice commerce
- `demo-olas-deep.ts`, `demo-olas-marketplace.ts` — Olas mechs
- `demo-virtuals.ts`, `demo-virtuals-deep.ts` — Virtuals GAME SDK
- `demo-self.ts`, `demo-self-deep.ts` — Self ZK identity
- `demo-bondcredit.ts` — bond.credit scoring
- `demo-merit.ts` — AgentCash/Merit x402
- `demo-talent.ts` — Talent Protocol
- `demo-openserv.ts` — OpenServ collaboration
- `demo-ampersend.ts`, `demo-ampersend-deep.ts` — Ampersend
- `demo-lit.ts`, `demo-lit-deep.ts` — Lit Protocol
- `demo-bankr.ts` — Bankr wallet
- `runtime.ts` — unified interface wrapping 18 sponsors
- `guard-client.ts`, `guarded-agent.ts`, `guarded-swap.ts` — AgentGuard integration code
- `agent-wallet.ts`, `agent-toolkit.ts`, `agent-orchestrator.ts`, `agent-auditor.ts`, `agent-intel.ts`, `agent-workflow.ts`
- Various pipeline demos: `demo-trust-pipeline.ts`, `demo-commerce-pipeline.ts`, `demo-combined.ts`, `demo-full.ts`, etc.

### Other Files
- `REQUIREMENTS.md` — hackathon submission checklist (detailed)
- `SUBMISSION.md` — draft submission with all API fields filled
- `README.md` — repo readme (needs update)
- Foundry deploy scripts (`Deploy.s.sol`, `DeployRouter.s.sol`)
- Broadcast/cache from actual deployments

---

## 3. REGISTRATION & SUBMISSION STATUS

### Registration: ✅ Complete
- Participant ID: `0824fdafe6694fd9a186cb9ca1d4dd4b`
- Team ID: `c3ba0334c6d7479ebd8a88b996ea66ed`
- API key saved to `~/.openclaw/credentials/.synthesis-api-key`
- ERC-8004 identity minted (token #34950)

### Repo: ✅ Created
- GitHub: `https://github.com/ortegarod/agentguard`
- Kyro added as collaborator
- Needs to be pushed and made public before submission

### Submission API: ❌ NOT SUBMITTED — NOT READY
- Rodrigo will decide when we're ready to submit. Do NOT ask or push for submission.
- POST /projects (create draft)
- POST /projects/:uuid/publish (make live)
- All calls must go through Rodrigo's Mac (Cloudflare)

### Moltbook Post: ❌ NOT DONE
- Required/encouraged for submission
- URL goes in `submissionMetadata.moltbookPostURL`

### Cloudflare Problem
- Our VPS IP (15.204.225.66) is blocked by Cloudflare on synthesis.devfolio.co
- ALL submission API calls must be run from Rodrigo's Mac
- synthesis.md = static docs only; synthesis.devfolio.co = actual API

---

## 4. FIRM DECISIONS (Rodrigo said these — DO NOT REVISIT EVER)

1. **NO MOCK DATA. EVER.** Real API/RPC/DB or show nothing. No hardcoded prices, fake TX hashes, setTimeout animations. Violated 3 times already (2026-02-19, 2026-03-20 x2).

2. **NO wallet address pasting.** The agent already knows its wallet. Copy-pasting an address is 2020 UX.

3. **Agent does NOT set its own policy.** That defeats the entire purpose. The HUMAN sets limits on the agent.

4. **User CONNECTS their wallet.** The vault model requires it — human deposits funds, signs policy transactions. MetaMask/WalletConnect on the dashboard.

5. **Product should be a SKILL.** An OpenClaw skill that the human installs on their agent. The skill handles registration. The human sets limits on the dashboard.

6. **Terms:** "trade size" / "daily volume" — NOT "spending" or "spending limits." Agents trade, they don't spend.

7. **Dashboard = control center.** Wallet connection, deposits, guardrail configuration, monitoring. The human manages the vault here.

8. **AgentVault is the core.** Funds live in the vault, not the agent's wallet. Agent can ONLY trade through the vault → router → policy path. No bypass possible.

9. **Honest about sponsors.** Only claim integrations that actually exist and work.

---

## 5. SOLVED PROBLEMS

### A. How does the agent register? ✅ SOLVED
- Agent installs AgentGuard skill → asks human for wallet address → POSTs to `/api/agent/register`
- Links agentWallet + humanWallet in backend DB
- Dashboard auto-discovers registered agents when human connects wallet

### B. How does the human set limits? ✅ SOLVED
- Human connects wallet on dashboard (ConnectKit)
- Sets guardrails via sliders → clicks "Create Vault" → signs one TX via VaultFactory
- VaultFactory deploys vault + sets policy + approves tokens in single transaction
- Human can update guardrails anytime (signs `updatePolicy` TX)
- Emergency stop button revokes agent's policy entirely

### C. How does linking work? ✅ SOLVED
- Human's wallet address is the link between agent and dashboard
- Agent registers with human's wallet → dashboard queries by connected wallet → agent appears
- No pairing codes needed. Trust is established by human installing the skill on their own agent.

### D. End-to-end user journey ✅ SOLVED
```
1. Human has an OpenClaw agent with a wallet
2. Human goes to dashboard → connects wallet → sees "Connect Your Agent" with copy buttons
3. Human sends skill URL to agent → agent curls skill.md → learns how to register
4. Human tells agent their wallet address → agent POSTs to /api/agent/register
5. Human refreshes dashboard → agent appears → sets guardrails → clicks "Create Vault"
6. One TX: vault deployed + policy set + tokens approved
7. Human deposits ETH into vault
8. Human generates strategies via Venice AI → picks one
9. Agent trades through vault → AgentGuardRouter → policy check → Uniswap
10. Human monitors on dashboard, can update guardrails or emergency stop anytime
```

### E. Empty state UX ✅ SOLVED
- 4-state dashboard: not connected → no agent → no vault → active
- Each state shows exactly what the user needs to do next
- No confusing pipeline or empty charts when nothing is set up

### REMAINING UNSOLVED
- **Deploy Strategy button** — doesn't execute yet (needs agent-side execution logic)
- **Vault upgradeability** — migrateTo() exists but no proxy pattern for seamless upgrades
- **Multi-vault management** — factory supports it but dashboard only shows first vault

---

## 6. SPONSOR INTEGRATIONS — HONEST STATUS

| Sponsor | Built? | What's real | What's NOT |
|---------|--------|------------|-----------|
| Uniswap | ✅ YES | Router wraps SwapRouter02 (V3), real swap verified on Basescan, `/api/uniswap/quote` calls Uniswap Trading API with API key, integrated in vault executeSwap() | V4 hook written but not deployed |
| Venice | ✅ YES | Strategy generation + chat via llama-3.3-70b, zero-retention inference, private financial analysis, full chat page, API key configured | — |
| Lido | ✅ YES | stETH APR on market page (live from Lido API), vault has stakeETH() + tradeYield() + availableYield(), principal tracking in contract | Needs Lido addresses configured per chain for live staking |
| Base | ✅ YES | All contracts deployed on Base Sepolia, VaultFactory, real RPC, wallet connection, gas reads | Not on mainnet |
| ENS | ✅ YES | Real mainnet resolution in API route | Just lookups |
| ERC-8004 | ✅ YES | Token #34950 minted, on-chain identity | — |
| Celo | ⚠️ PARTIAL | Real cUSD supply read from Celo RPC | Just one read call |
| MetaMask | ⚠️ PARTIAL | ConnectKit supports MetaMask for wallet connection | No delegation framework integration |
| Status Network | ❌ NO | Nothing built | |
| IPFS/Filecoin | ❌ NO | Nothing real | |
| Locus | ❌ NO | Nothing integrated | |
| Self | ❌ NO | Nothing integrated | |
| Olas | ❌ NO | Nothing integrated | |
| Bankr | ❌ NO | Have the skill but not integrated | |
| Virtuals | ❌ NO | Nothing integrated | |
| Slice | ❌ NO | Nothing integrated | |
| bond.credit | ❌ NO | Nothing integrated | |

**HONEST TRACK ASSESSMENT — only submit to tracks where we have REAL integration:**

| Track | Submit? | Justification |
|-------|---------|---------------|
| Open Track | ✅ YES | Always submit |
| Uniswap Agentic Finance | ✅ YES | Router + verified swap + Trading API integration |
| Venice Private Agents | ✅ YES | Venice chat + strategy generation, API key, zero-retention |
| Autonomous Trading Agent (Base) | ✅ YES | Vault+policy architecture, real contracts on Base Sepolia |
| stETH Agent Treasury (Lido) | ✅ YES | Vault literally matches their description — principal locked, yield tradeable |
| ERC-8004 Agents With Receipts | ✅ YES | Token #34950 minted |
| Agent Services on Base | ⚠️ MAYBE | AgentGuard as infrastructure service — stretch |
| Bankr LLM Gateway | ❌ NO | Not integrated |
| MetaMask Delegations | ❌ NO | No delegation framework |
| Locus | ❌ NO | Not integrated |

---

## 7. COMPETITION

Others doing agent wallet guardrails:
- **Openfort** — smart wallets with policy rules
- **Coinbase Agentic Wallets** — CDP-managed agent wallets
- **Alchemy** — smart account infrastructure
- **Privy** — embedded wallets with server-side controls
- **AgentVault** — vault-based spending controls
- **AxonFi** — DeFi guardrails
- **ProofGate** — proof-based access control

**All of them are wallet providers.** Our angle: AgentGuard works with ANY existing wallet. It's a standalone contract, not a wallet.

---

## 8. KEY ADDRESSES & IDENTIFIERS

| What | Address/ID |
|------|-----------|
| AgentPolicy contract | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` |
| AgentGuardRouter v2 | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` |
| AgentVault v1 (demo) | `0x333896c4c1b58c5c9b56967301c008C073Bd2279` |
| VaultFactory v2 (with Lido) | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` |
| AgentGuardRouter v1 (obsolete) | `0x056C1cEC49b335a31247506d30fE36B063cf8B84` |
| Owner wallet (Kyro) | `0x90d9c75f3761c02Bf3d892A701846F6323e9112D` |
| Agent wallet (Bankr) | `0xf25896f67f849091f6d5bfed7736859aa42427b4` |
| WETH (Base Sepolia) | `0x4200000000000000000000000000000000000006` |
| USDC (Base Sepolia) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| SwapRouter02 (Base Sepolia) | `0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4` |
| Uniswap V3 Factory (Base Sepolia) | `0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24` |
| WETH/USDC pool 3000 fee | `0x46880b404CD35c165EDdefF7421019F8dd25F4Ad` |
| Verified swap TX | `0x1abcce6a...3037422d1` |
| Participant ID | `0824fdafe6694fd9a186cb9ca1d4dd4b` |
| Team ID | `c3ba0334c6d7479ebd8a88b996ea66ed` |
| ERC-8004 token | #34950 |
| Chain | Base Sepolia (chainId 84532) |

---

## 9. FILE LOCATIONS

| What | Path |
|------|------|
| This roadmap | `~/repos/agentguard/ROADMAP.md` |
| Requirements checklist | `~/repos/agentguard/REQUIREMENTS.md` |
| Submission draft | `~/repos/agentguard/SUBMISSION.md` |
| **Contracts** | `~/repos/agentguard/contracts/src/` |
| — AgentPolicy.sol | Policy engine (deployed) |
| — AgentGuardRouter.sol | Uniswap swap wrapper (deployed) |
| — AgentVault.sol | User vault with Lido support (deployed via factory) |
| — VaultFactory.sol | One-TX vault deployment (deployed) |
| — AgentGuard.sol (v4 hook) | Written, NOT deployed |
| **Web app** | `~/repos/agentguard/app/` |
| — Layout + nav | `app/app/layout.tsx` |
| — NavTabs component | `app/app/components/NavTabs.tsx` |
| — ConnectWallet | `app/app/components/ConnectWallet.tsx` |
| — AgentContext (shared state) | `app/app/components/AgentContext.tsx` |
| — Providers (wagmi + context) | `app/app/providers.tsx` |
| — Landing page | `app/app/page.tsx` |
| — Vault page | `app/app/dashboard/page.tsx` + `DashboardClient.tsx` |
| — Strategy page | `app/app/strategy/page.tsx` |
| — Activity page | `app/app/activity/page.tsx` |
| — Chat page | `app/app/chat/page.tsx` |
| — Market page | `app/app/market/page.tsx` |
| — Guardrails page | `app/app/guardrails/page.tsx` |
| — Wallet config | `app/app/config/wagmi.ts` |
| — Agent register API | `app/app/api/agent/register/route.ts` |
| — Vault status API | `app/app/api/vault/status/route.ts` |
| — Uniswap quote API | `app/app/api/uniswap/quote/route.ts` |
| — Chat API (Venice) | `app/app/api/chat/route.ts` |
| — Rates API | `app/app/api/rates/route.ts` |
| — Skill endpoint | `app/app/api/skill/route.ts` |
| — Policy API | `app/app/api/policy/route.ts` |
| — ENS API | `app/app/api/ens/route.ts` |
| — Agent data store | `app/data/agents.json` |
| — Env vars | `app/.env.local` (UNISWAP_API_KEY, VENICE_API_KEY) |
| **Agent skill** | `~/repos/agentguard/skill/SKILL.md` |
| **Deploy scripts** | `~/repos/agentguard/contracts/script/` |
| 75 sponsor demos | `~/repos/synthesis/src/` |
| Hackathon reference | `~/.openclaw/workspace/memory/synthesis-hackathon.md` |
| API key | `~/.openclaw/credentials/.synthesis-api-key` |
| Venice API key | `~/.openclaw/credentials/.venice-api-key` |
| Private key | `~/.openclaw/credentials/.kyro-wallet-key` |

---

## HACKATHON REFERENCE

### Key Links
- **Hackathon page:** https://synthesis.md
- **Registration/API skill:** https://synthesis.md/skill.md → installed at `~/.openclaw/workspace/skills/synthesis/SKILL.md`
- **Submission skill:** https://synthesis.md/submission/skill.md → installed at `~/.openclaw/workspace/skills/synthesis/submission-skill.md`
- **To update skills:** `curl -s https://synthesis.md/skill.md -o ~/.openclaw/workspace/skills/synthesis/SKILL.md && curl -s https://synthesis.md/submission/skill.md -o ~/.openclaw/workspace/skills/synthesis/submission-skill.md`
- **Prize catalog:** https://synthesis.devfolio.co/catalog (Cloudflare — must access from Rodrigo's Mac)
- **Themes/ideas:** https://synthesis.md/themes.md
- **Telegram updates:** https://nsb.dev/synthesis-updates
- **API Base URL:** https://synthesis.devfolio.co

### Timeline
- Feb 20: Registrations start
- Mar 13: Building starts
- Mar 22: Building ends (exact time TBD — countdown on synthesis.md)
- Mar 25: Winners announced

### Our Registration
- **Participant ID:** `0824fdafe6694fd9a186cb9ca1d4dd4b`
- **Team ID:** `c3ba0334c6d7479ebd8a88b996ea66ed`
- **ERC-8004 token:** #34950
- **API key:** stored at `~/.openclaw/credentials/.synthesis-api-key`
- **Auth header:** `Authorization: Bearer sk-synth-...`
- **⚠️ Cloudflare blocks all API calls from our VPS.** Submissions must go through Rodrigo's Mac.

### Tracks (from our hackathon reference file)
1. `44bf2e33d6674db78cba2abacfd22d74` — Agents With Style — design + UX
2. `bb2f0fe4bd654aa791d9e7e23e8d05b9` — Best Uniswap API Integration
3. `1f5e08ebf96a4d3e82f21313b07b33b3` — Best Use of Locus
4. `8ac4fa1a90294e14a41f3e29b0e4b4ff` — Autonomous Trading Agent on Base
5. `3bf41be958da497bbb69f1a150c76af9` — Agents With Receipts — ERC-8004
6. `6c5e45e1c12e40c6a25f7eb7dff7c8a1` — Agentic Finance
7. Private Agents (Venice) — UUID TBD
8. Open Track — always included

### Hackathon Rules
1. Ship something that works. Demos, prototypes, deployed contracts.
2. Agent must be a real participant. Not a wrapper. Show meaningful contribution.
3. Everything on-chain counts. More on-chain artifacts = stronger submission.
4. Open source required. All code must be public by deadline.
5. Document your process. Use `conversationLog` to capture human-agent collaboration.

### Self-Custody Transfer: ✅ DONE
- ERC-8004 token #34950 minted
- Required for publishing (all team members must be transferred)

---

## 10. SUBMISSION REQUIREMENTS (from Devfolio API)

### Required Fields
- `name` — "AgentGuard"
- `description` — elevator pitch
- `problemStatement` — specific, grounded problem description
- `repoURL` — PUBLIC GitHub repo
- `trackUUIDs` — at least 1, max 10 + Open Track
- `conversationLog` — human-agent collaboration narrative (can be curated, not raw)
- `submissionMetadata`:
  - `agentFramework` — "other" (custom TypeScript + Solidity)
  - `agentHarness` — "openclaw"
  - `model` — "claude-opus-4-6"
  - `skills` — agent skill IDs used
  - `tools` — concrete tools (viem, Foundry, etc.)
  - `helpfulResources` — URLs consulted
  - `intention` — "continuing"

### Optional
- `deployedURL` — live dashboard
- `videoURL` — demo video
- `pictures` — screenshots
- `coverImageURL`
- `moltbookPostURL`

### Process (all from Rodrigo's Mac due to Cloudflare)
1. POST /participants/me/transfer/init (self-custody)
2. POST /participants/me/transfer/confirm
3. POST /projects (create draft)
4. POST /projects/:uuid/publish

---

## 11. THE PLAN — AI VAULT MANAGER (2026-03-21)

### New Direction (Rodrigo, March 21)

**Product pivot:** AgentGuard is no longer just "guardrails for agents." It's an **AI Vault Manager** — a platform where humans manage their DeFi money through their AI agent, with on-chain guardrails.

**The problem Rodrigo described:**
- Everyone has AI agents now. Everyone needs yield from DeFi because banks don't pay enough.
- But nobody knows how to do DeFi properly — it's complex, easy to make mistakes, too many protocols.
- Old school: connect wallet to Uniswap, figure it out yourself.
- New school: give your money to your AI agent, set strategy + limits on our platform, agent executes.
- Like having a financial advisor, but it's your own AI with blockchain-enforced limits.

**Key insight:** We don't hold anyone's money. We provide the platform to connect your AI agent and manage it — strategy, guardrails, monitoring. Think of it like a stock portfolio tracker (Fidelity, Robinhood) but for DeFi with an AI agent doing the execution.

**The financial advisor analogy:**
- You don't just hand money to an advisor and say "do whatever"
- They assess your risk tolerance, goals, timeline
- They propose a strategy, you approve it
- They execute within agreed bounds
- You monitor via reports/dashboard
- Same thing here, but the advisor is an AI agent and the bounds are on-chain

### Architecture (4 layers)
1. **On-chain layer** — AgentPolicy + GuardRouter (ALREADY BUILT, enforces limits regardless)
2. **Execution layer** — reads positions, calls protocols (Uniswap, Lido), logs everything
3. **Reasoning layer** — pluggable LLM (Venice, OpenClaw, OpenAI, etc.) that takes (portfolio + strategy + market) → decisions
4. **Management layer** — web dashboard where human sets strategy, monitors activity, views guardrails

### LLM Provider: Pluggable (Rodrigo's requirement)
- Venice as default demo option (Rodrigo has $50 promo)
- But architecture must be provider-agnostic
- OpenClaw agents, Claude, GPT, local models — all should work
- The on-chain contracts don't care who made the decision

### Onboarding Flow (guided, not a blank prompt)
1. Risk profile — Conservative / Moderate / Aggressive
2. Goals — Preserve Capital / Generate Yield / Growth
3. Allocation — agent proposes based on risk+goals, human approves/adjusts
4. Guardrails — max trade size, daily volume limit → written to AgentPolicy.sol
5. Confirmation — summary, then go

### What to build on the EXISTING app (port 3002, ~/repos/agentguard/app/)
- **DO NOT create new apps. Build on what exists.**
- Add onboarding flow (the guided strategy setup)
- Add portfolio view (real on-chain balances + positions)
- Add activity log (empty for MVP — no fake entries)
- Keep existing real data reads (policy, rates, ENS)
- Add Venice integration when API key is available

### Tracks to target
1. Open Track (always)
2. Agentic Finance / Best Uniswap API Integration (router + swaps)
3. Best Use of Locus (if we integrate wallet management)
4. Private Agents (Venice — if we integrate)
5. Autonomous Trading Agent on Base

### What's been built (chronological)

**Smart Contracts (Base Sepolia — all deployed, real, on-chain):**
- [x] AgentPolicy.sol — policy engine (deployed)
- [x] AgentGuardRouter.sol — Uniswap V3 swap wrapper (deployed)
- [x] AgentVault.sol — holds user funds, only agent can trade through router (deployed via factory)
- [x] VaultFactory.sol — one-TX vault deployment (deployed)
- [x] AgentGuard.sol — Uniswap V4 hook version (written, NOT deployed)
- [x] Lido staking support in vault (stakeETH, tradeYield, principal tracking)
- [x] Vault migration function (migrateTo)
- [x] Verified real swap: 0.005 WETH → 2.045 USDC through policy check on Basescan

**Web App (Next.js on port 3002):**
- [x] Landing page with product marketing
- [x] Tab-based navigation (Vault, Strategy, Activity, Chat, Market, Guardrails)
- [x] Shared AgentContext provider across all pages
- [x] Wallet connection via ConnectKit with hydration fix
- [x] Agent registration flow (copy-paste instructions for agent)
- [x] Create Vault from dashboard (calls VaultFactory.createVault)
- [x] Deposit ETH from dashboard (calls vault.depositETH)
- [x] Strategy page — Venice AI generates 3 strategies with guardrails baked in
- [x] "Approve & Start Agent" → deploys guardrails on-chain, shows "Agent Running" state
- [x] "Pause Agent" button (revokes policy)
- [x] Activity page with verified swap TX + Basescan link
- [x] Agent page (was "Chat") — instructions to connect your own agent via skill file (no embedded chatbot)
- [x] Market page — live ETH price, stETH APR, gas, protocol cards
- [x] Guardrails page — explains on-chain enforcement, shows limits, daily usage, approved tokens, **Private Mode toggle**
- [x] PrivacyIndicator component — reads real private mode state, shows enforced vs standard
- [x] Portfolio view with real on-chain balance data

**API Routes:**
- [x] `/api/agent/register` — POST/GET agent registration
- [x] `/api/vault/status` — real on-chain vault state
- [x] `/api/vault/private-mode` — GET/POST private mode toggle per vault
- [x] `/api/pipeline` — Venice strategy generation, enforces Private Mode when active
- [x] `/api/uniswap/quote` — Uniswap Trading API integration (API key configured)
- [x] `/api/rates` — live market data (CoinGecko, Lido, Base RPC)
- [x] `/api/skill` — serves unified SKILL.md
- [x] `/api/policy` — on-chain policy state
- [x] `/api/ens` — ENS resolution

**Agent Skill:**
- [x] Unified SKILL.md covering ALL features (register, vault, swap, quote, stake, rates, chat)
- [x] Autonomous operation guide with heartbeat routine
- [x] Served at `/api/skill`

**Other:**
- [x] Self-custody transfer (ERC-8004 #34950 minted)
- [x] Full prize catalog with track descriptions
- [x] README for submission
- [x] 75 sponsor exploration demos (~/repos/synthesis/src/)
- [x] Uniswap API key configured in .env.local
- [x] Venice API key configured in .env.local

### What was built March 21-22 (final push)

**Private Mode — Real Guardrail (not just a badge):**
- [x] `/api/vault/private-mode` — GET/POST endpoint, persists per-vault toggle to `data/private-mode.json`
- [x] Guardrails page has a real toggle — flip it on, all AI inference for that vault MUST go through Venice
- [x] `/api/pipeline` (strategy endpoint) enforces Private Mode — when active, only Venice can generate strategies
- [x] PrivacyIndicator in nav reads real state — purple + green dot when active, gray when off
- [x] Click indicator → detail panel shows what's enforced vs standard mode
- [x] Skill file updated with private-mode and pipeline docs for agents

**Chat → Agent page rename:**
- [x] Tab renamed "Chat" → "Agent"
- [x] No more embedded Venice chatbot on the website (solves two-agent identity problem)
- [x] Agent page shows instructions to connect your own agent via skill file

**Data Storage — What we store vs what we don't:**
- `data/agents.json` — agent wallet, human wallet, name, platform, timestamp (linking only)
- `data/private-mode.json` — vault address → boolean (preference only)
- **NO financial data stored.** Balances read from chain. Strategies generated on-the-fly via Venice (zero retention). Trade history from chain events. Chat not logged.
- **Note:** Pipeline endpoint receives vault balances in POST body to generate strategies. They transit our server to Venice and back but are NOT stored anywhere. Venice has zero data retention.

### What's left for submission
- [ ] Push to GitHub (ortegarod/agentguard — repo created, Kyro is collaborator) — **NEED RODRIGO APPROVAL**
- [ ] Make repo PUBLIC before deadline
- [ ] Update SUBMISSION.md with current product description (old draft references V4 hook framing)
- [ ] Write conversationLog for submission
- [ ] Moltbook post announcing the project
- [ ] Self-custody transfer via Devfolio API (2 curls from Rodrigo's Mac)
- [ ] Create + publish project via Devfolio API (2 curls from Rodrigo's Mac)
- [ ] Optional: demo video, screenshots
- **⚠️ ALL submission API calls must go through Rodrigo's Mac (Cloudflare blocks our VPS)**
- **⚠️ Rodrigo decides when to submit. DO NOT ASK.**

### CRITICAL RULE added 2026-03-21
**ONE APP. ONE DIRECTORY. ONE PORT.** The app is `~/repos/agentguard/app/` on port 3002. Do not create new directories, new apps, or new ports. All work happens here. Read this roadmap before every session.

### FIRM DECISIONS added 2026-03-21 (from Rodrigo — DO NOT REVISIT)

10. **Agent NEVER sets its own guardrails.** The HUMAN sets guardrails on the dashboard. The agent cannot change them. If the agent could change its own guardrails, they're not guardrails.

11. **The dashboard is where configuration happens, NOT the chat.** Users toggle protocols on/off on the dashboard. Users set limits on the dashboard. The chat is for the agent to present strategies and answer questions — not for configuration.

12. **The user doesn't know DeFi.** Don't assume they know what staking, APRs, or LP means. The agent figures out the strategy. The user just approves.

13. **The agent assesses risk and proposes strategies.** Based on which protocols the user has ENABLED on the dashboard, the agent uses private inference (Venice) to analyze current market conditions and propose strategies. The user doesn't have to know anything.

14. **The app must add value beyond what the user can do themselves.** If the user can just go to Lido and click "stake," the app is useless. The value is: agent analyzes multiple protocols, finds the best strategy across the ones you've enabled, and executes — all within your guardrails.

### FIRM DECISIONS added 2026-03-21 evening (from Rodrigo — DO NOT REVISIT)

15. **The agent runs AUTONOMOUSLY.** This is not prompt-driven. The user approves a strategy, the agent runs on its own schedule (heartbeat), rebalancing, finding yield, making trades. The dashboard shows what it's doing. The guardrails are the cage.

16. **No manual guardrail sliders before strategy.** The user doesn't know what slippage or max trade size means. The AI proposes strategies WITH guardrails baked in. The user just picks one. Guardrails come FROM the strategy, not before it.

17. **No risk questionnaires.** "Conservative / Balanced / Aggressive" is lazy. The AI should figure out what to do and propose it. The user says yes or no.

18. **Tab-based navigation.** Each feature gets its own page. Vault, Strategy, Activity, Chat, Market, Guardrails. No hidden tabs buried in the middle of a page.

19. **One unified skill file.** Not separate instructions for each feature. One SKILL.md that teaches any agent how to use ALL of AgentGuard (register, deposit, swap, quote, stake, etc.).

20. **Use the Uniswap Trading API.** Not raw V3 SwapRouter02 calls. The hackathon track says "Best Uniswap API" — use their actual API for quotes/routing.

21. **Chat page needs rethinking.** Currently two AI identities: the user's OpenClaw agent (who trades) and a Venice chat agent on the website (who answers questions). This is weird. Parking for now but needs resolution.

### Product Vision (March 21 — iterated with Rodrigo)

**Problem:** "I have crypto doing nothing because DeFi is too complicated, and I don't trust anyone else to manage it."

**Solution:** Your own AI agent manages your DeFi portfolio. You control what it can touch and how much. It figures out the best strategy using private inference (Venice). Nobody else sees your financial data.

**Why this beats alternatives:**
- vs doing it yourself: you don't need to know DeFi
- vs Yearn/Locus vaults: it's YOUR agent, YOUR limits, YOUR strategy choice
- vs just going to Lido: the agent optimizes across MULTIPLE protocols simultaneously
- vs traditional advisors: private AI inference, on-chain enforcement, 24/7

### Product Flow (CURRENT — March 21 evening)

```
1. User connects wallet on dashboard
2. User copies agent instructions → sends to their AI agent (OpenClaw, etc.)
3. Agent curls /api/skill → learns how to use AgentGuard
4. Agent POSTs to /api/agent/register with human's wallet
5. Dashboard detects agent → user clicks "Create Vault" (one wallet TX, ~$0.03)
6. User deposits ETH into vault
7. User goes to Strategy tab → clicks "Show Me Strategies"
8. Venice AI analyzes protocols, yields, market → proposes 3 strategies
   - Each strategy includes guardrails (max trade, daily limit, slippage, protocols)
   - Plain English — user doesn't need to know DeFi
9. User picks a strategy → clicks "Approve & Start Agent"
   - Guardrails written on-chain via updatePolicy()
   - Dashboard shows "Agent Running" with green pulse
10. Agent runs AUTONOMOUSLY on heartbeat:
    - Checks rates, rebalances, swaps, stakes
    - All within on-chain guardrails — can't exceed them
11. User monitors on Activity tab, can chat on Chat tab
12. User can "Pause Agent" anytime (revokes policy on-chain)
```

**Key: everything is flexible.** User can deposit at any time, generate strategies at any time, chat at any time. No forced flow — tabs let them jump to any feature.

### App Layout (Tab-Based)

| Tab | URL | What's There |
|-----|-----|-------------|
| Vault | `/dashboard` | Balances (WETH/USDC), deposit ETH, agent info, create vault |
| Strategy | `/strategy` | AI generates 3 strategies, approve & start agent, pause agent |
| Activity | `/activity` | Trade history with Basescan links |
| Agent | `/chat` | Instructions to connect your own agent via skill file (no embedded chatbot) |
| Market | `/market` | ETH price, stETH APR, gas, protocol cards |
| Guardrails | `/guardrails` | How enforcement works, current limits, daily usage, approved tokens, **Private Mode toggle** |

### The AI's Role (INSTRUMENTAL — not secondary, not primary, always present)

The AI is the intelligence layer. Without it, the user can't make decisions because they don't understand DeFi. Without the dashboard, the user can't control anything. Both are the product.

- Analyzes market conditions across enabled protocols
- Generates strategy proposals with plain-English explanations
- Executes the chosen strategy within guardrails
- Available via chat to explain anything, answer questions, suggest changes
- Uses Venice for private inference — financial analysis stays private

---

## WHAT WE BUILT — FULL TECHNICAL BREAKDOWN

### Layer 1: Smart Contracts (Base Sepolia — all deployed and verified)

**Chain:** Base Sepolia (chain ID 84532)

| Contract | Address | What It Does |
|----------|---------|-------------|
| **VaultFactory** | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` | Deploys a new AgentVault + sets policy + approves tokens in ONE transaction |
| **AgentPolicy** | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` | Stores per-agent spending rules: per-token limits, per-swap caps, daily ceilings. Human sets these. Agent cannot change its own policy. |
| **AgentGuardRouter** | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` | Wraps Uniswap V3 SwapRouter02. Checks AgentPolicy BEFORE executing every swap. If agent exceeds limits → transaction reverts. |
| **AgentVault** (demo instance) | `0x333896c4c1b58c5c9b56967301c008C073Bd2279` | Holds user funds. Tracks principal (original deposit). Agent can only trade yield above principal — cannot touch the original deposit. |

**Verified swap TX:** [`0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1`](https://sepolia.basescan.org/tx/0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1) — real swap through the router, policy checked, on Basescan.

**How the contracts connect:**
```
Human creates vault via VaultFactory
  → VaultFactory deploys AgentVault (holds funds)
  → VaultFactory calls AgentPolicy.setPolicy() (spending limits)
  → VaultFactory approves tokens on the vault (which tokens agent can trade)

Agent wants to swap WETH → USDC:
  → Agent calls AgentGuardRouter.swapExactInput()
  → Router calls AgentPolicy.checkPolicy(agent, token, amount)
  → If within limits → Router forwards to Uniswap V3 SwapRouter02
  → If exceeds limits → Transaction reverts (on-chain, automatic)
```

**Key design choices:**
- Principal tracking: vault knows how much was deposited vs. how much is yield. Agent trades yield only.
- Policy is set by the HUMAN wallet. Agent wallet can only read its policy, never change it.
- Router is a wrapper, not a fork. Real Uniswap V3 liquidity underneath.

**What's NOT on mainnet:** Everything is testnet. Path to mainnet = redeploy with chain ID 8453. No code changes needed.

### Layer 2: API Endpoints (Next.js backend — all running on port 3002)

**Server:** `http://100.71.117.120:3002`

| Endpoint | Method | What It Does | Status |
|----------|--------|-------------|--------|
| `/api/vault/status` | GET | Returns vault balances, agent info, policy limits | ✅ Working |
| `/api/vault/deposit` | POST | Returns unsigned TX data for depositing ETH into a vault. Agent signs and broadcasts. | ✅ Working (Sepolia) |
| `/api/vault/swap` | POST | Gets a Uniswap Trading API quote, then builds a swap TX through AgentGuardRouter. Returns unsigned TX. | ✅ Working (Sepolia) |
| `/api/vault/stake` | POST | Builds a Lido staking TX (ETH → stETH → wstETH via vault). Returns unsigned TX. | ✅ Working (Sepolia, but no real Lido on Sepolia) |
| `/api/vault/yield` | GET | Reads principal + available yield from the vault contract on-chain | ✅ Working (reads real chain state) |
| `/api/uniswap/quote` | POST | Proxies to Uniswap Trading API (`trade-api.gateway.uniswap.org/v1/quote`) with our API key | ✅ Working (real Uniswap API) |
| `/api/rates` | GET | Live ETH price from CoinGecko, stETH APR from Lido API, gas from Base RPC | ✅ Working (real APIs) |
| `/api/chat` | POST | Venice AI chat endpoint — zero data retention, private inference | ✅ Working (real Venice API) |
| `/api/pipeline` | POST | Venice AI strategy generation — analyzes rates + vault state, proposes strategies with guardrails. **Enforces Private Mode** — when active, all inference must go through Venice. | ✅ Working (real Venice API) |
| `/api/vault/private-mode` | GET/POST | Toggle Private Mode per vault. When active, forces Venice-only inference (zero data retention). | ✅ Working |
| `/api/policy` | GET/POST | Read or set policy on AgentPolicy contract | ✅ Working (Sepolia) |
| `/api/agent/register` | POST | Registers an agent wallet to a vault | ✅ Working (Sepolia) |

**How the API and contracts connect:**
```
Agent (via skill) calls API endpoint
  → API builds unsigned transaction data
  → Returns TX to agent
  → Agent signs with its own wallet
  → Agent broadcasts to Base Sepolia
  → Smart contract executes (with policy checks)
```

The API never holds keys. It builds transactions. The agent signs them. This is the standard pattern — non-custodial.

**External APIs used (all real, all with API keys configured):**
- **Uniswap Trading API** — `trade-api.gateway.uniswap.org/v1/quote` (env: `UNISWAP_API_KEY`)
- **Venice AI** — `api.venice.ai/api/v1/chat/completions` (env: `VENICE_API_KEY`)
- **CoinGecko** — free tier, no key needed
- **Lido** — `eth-api.lido.fi/v1/protocol/steth/apr/sma` (free, no key)
- **Base Sepolia RPC** — default public RPC via viem

### Layer 3: Web Dashboard (Next.js frontend — 6 tabs)

| Tab | URL | What It Shows |
|-----|-----|--------------|
| **Vault** | `/dashboard` | Wallet connection (ConnectKit), vault balances (WETH/USDC), deposit button, agent status, create vault button |
| **Strategy** | `/strategy` | Venice AI generates 2-3 strategies with guardrails baked in. User picks one → "Approve & Start Agent" → agent runs autonomously |
| **Activity** | `/activity` | Trade history pulled from vault events, Basescan links for every TX |
| **Agent** | `/chat` | Instructions to connect your own AI agent via skill file. No embedded chatbot — your agent lives on your infra. |
| **Market** | `/market` | Live ETH price, stETH APR, gas prices, protocol cards (Lido, Uniswap) — all from real APIs |
| **Guardrails** | `/guardrails` | On-chain enforcement explained. Policy limits, daily usage, approved tokens. **Private Mode toggle** — forces Venice-only inference for zero data retention. |

**Shared state:** `AgentContext` provider wraps all pages — wallet connection, vault data, rates, agent status all shared.

**Key UX decisions:**
- No forced flow — tabs let user explore any feature in any order
- AI proposes strategies WITH guardrails — user doesn't set slippage or gas limits
- "Create Vault" explains gas fees upfront
- Agent runs autonomously after approval — heartbeat-driven, not prompt-driven

### Layer 4: Agent Skill File

**File:** `skill/SKILL.md` — one unified document that teaches any AI agent to use AgentGuard.

**What the skill covers:**
- How to register as an agent (POST `/api/agent/register`)
- How to deposit ETH (POST `/api/vault/deposit` → sign → broadcast)
- How to swap tokens (POST `/api/vault/swap` → sign → broadcast, policy enforced by router)
- How to stake ETH into Lido (POST `/api/vault/stake`)
- How to check yield (GET `/api/vault/yield`)
- How to check market conditions (GET `/api/rates`)
- How to set up heartbeat monitoring (check vault → check rates → trade if profitable → repeat)

**OpenClaw integration:** Skill includes specific HEARTBEAT.md instructions so an OpenClaw agent can add vault monitoring to its heartbeat cycle.

**Key point:** This isn't locked to our agent. Any agent that can read a markdown file and make HTTP calls can manage a vault through AgentGuard.

### Layer 5: Sponsor Integrations (honest status)

| Sponsor | Integration | How Real Is It |
|---------|------------|----------------|
| **Venice AI** | Strategy generation + chat, zero-retention inference, **Private Mode enforcement** | ✅ Real — API key configured, Private Mode toggle forces Venice-only inference, financial data never stored. Pipeline endpoint enforces PM per-vault. |
| **Uniswap** | Trading API for quotes via `/api/uniswap/quote`, AgentGuardRouter wraps V3 SwapRouter02 | ✅ Real — API key configured, real quotes returned, real swaps executed through router |
| **Lido** | Vault can stake ETH → stETH, APR pulled from Lido API, principal tracking enables yield-only trading | ⚠️ Partial — APR is real (from Lido API), staking endpoint exists, but no real Lido on Sepolia so staking TX would fail on-chain |
| **Base** | All contracts deployed on Base Sepolia, all TXs on Base | ✅ Real — verified on Basescan |
| **ERC-8004** | Agent has on-chain identity (token #34950) | ✅ Real — minted during registration |

### What Would It Take for Mainnet

1. Deploy 3 contracts to Base mainnet (gas cost: ~$5-10 in ETH)
2. Change chain ID from 84532 → 8453 in API endpoints
3. Lido staking works natively on mainnet (wstETH is live on Base)
4. Update RPC endpoint to mainnet
5. No code changes to contracts or frontend logic

That's it. The architecture is chain-agnostic by design.

---

## 12. AUDIT — March 22, 2026

### Brand
- Renamed AgentGuard → MoltFi across all user-facing code (16 files)
- `agentguard.app` references updated to `moltfi.app`
- Contract names on-chain unchanged (already deployed)

### 🔴 BUGS & FALSE CLAIMS (must fix)

**1. Chat system prompt claims Aave & Uniswap LP — NOT available**
- `app/api/chat/route.ts` SYSTEM_PROMPT references "Aave: USDC lending" and "Uniswap V3: Liquidity provision"
- We only have Uniswap swaps + Lido staking. Advisor will propose impossible strategies.
- **Fix:** Remove Aave, change Uniswap to swaps-only in system prompt.

**2. Landing page lists ENS, Celo, ERC-8004 as integrated tech — they're not**
- ENS: `/api/ens` exists but only does name→address lookup. Not used by anything.
- Celo: rates API reads cUSD supply. Nothing in the app uses it.
- ERC-8004: Listed as "On-chain agent identity" but no ERC-8004 code in MoltFi.
- **Fix:** Remove from landing page tech grid, or add honest descriptions.

**3. wstETH token has zero address `0x000...000` on guardrails page**
- `app/guardrails/page.tsx` line 14: wstETH address is all zeros
- Toggling it would approve the zero address on-chain
- **Fix:** Either get real wstETH address on Base Sepolia or remove from UI.

**4. `/api/register` is dead/legacy**
- Returns empty response. Duplicate of `/api/agent/register`.
- **Fix:** Delete `app/api/register/route.ts`.

**5. `/api/vault/stake` fails — "not owner" error**
- Tries to stake from Kyro's hardcoded wallet, not the vault owner's
- **Fix:** Needs to be called by vault owner or rethink signing flow.

**6. `/api/vault/swap` — nonce/gas issues**
- "replacement transaction underpriced" error on test
- May need nonce management or gas estimation fix
- **Fix:** Investigate nonce handling, add retry logic.

### 🟡 NEEDS WORK

**7. No API auth on swap/deposit endpoints**
- Anyone can call `/api/vault/deposit` or `/api/vault/swap` if they know the vault address
- Server signs with Kyro's key — any caller triggers real transactions
- On-chain policy limits damage but it's still sloppy
- **Fix:** Add API key or signature-based auth for agent endpoints.

**8. Private Mode was a flag, not enforced — NOW FIXED**
- Chat + pipeline APIs now check vault private mode status
- If Venice is down and private mode ON → 503 error instead of fallback
- Response always includes `provider: "venice"`, `privateMode: bool`

**9. Strategy page was localStorage-dependent — NOW FIXED**
- Strategy page now uses `vaultData.policy.active` as source of truth
- If policy active on-chain but no cached strategy → still shows active with on-chain guardrails
- Vault page now shows strategy status bar

**10. Overview section had unrealistic numbers — NOW FIXED**
- Performance API was extrapolating 1 testnet trade into 514,453% APR
- Now shows actual P&L %, only annualizes after 7+ days
- ETH price fixed with Coinbase fallback (CoinGecko rate-limits)

**11. "Change Strategy" nuked active state — NOW FIXED**
- Now shows back button, doesn't clear active strategy

### ✅ WORKING CORRECTLY (verified March 22)

| Endpoint/Feature | Status | Notes |
|---|---|---|
| `/api/rates` | ✅ | ETH $2,117 (Coinbase fallback working), Lido 2.42%, gas 0.006 gwei |
| `/api/policy` | ✅ | Reads live: active=true, maxPerAction=1 ETH |
| `/api/vault/status` | ✅ | Real balances: 0.03 ETH, 0.004 WETH, 0.60 USDC |
| `/api/vault/activity` | ✅ | 4 real on-chain events with tx hashes |
| `/api/vault/performance` | ✅ | Fixed ETH price ($2,115), 1 trade, realistic return |
| `/api/vault/private-mode` | ✅ | Toggle works, privateMode=true |
| `/api/vault/yield` | ✅ | principal=0, yield=0 (correct for current state) |
| `/api/chat` | ✅ | Venice AI working, private mode enforcement |
| `/api/pipeline` | ✅ | Venice AI working, private mode enforcement |
| `/api/skill` | ✅ | Serves MoltFi skill file |
| `/api/agent/register` | ✅ | Kyro registered as agent |
| `/api/vault/deposit` | ✅ | Works (deposited 0.001 ETH in test) |
| Strategy page | ✅ | On-chain source of truth, back button, real guardrail values |
| Activity page | ✅ | Real blockchain data, Basescan links |
| Guardrails page | ✅ | Reads/writes on-chain, private mode toggle |
| Overview section | ✅ | Condensed, realistic numbers |

### 📋 TODO (Priority Order)

1. [ ] Remove false claims from landing page (Aave, ENS, Celo, ERC-8004)
2. [ ] Fix chat system prompt — only Lido staking + Uniswap swaps
3. [ ] Fix wstETH zero address on guardrails page
4. [ ] Delete dead `/api/register` endpoint
5. [ ] Install Venice as OpenClaw model provider → test agent-to-agent flow
6. [ ] Add basic auth to swap/deposit API endpoints
7. [ ] Fix `/api/vault/stake` owner check
8. [ ] Fix `/api/vault/swap` nonce management
9. [ ] Add "switching strategy" confirmation (will revoke old + set new)
10. [ ] Private Mode toggle from PrivacyIndicator (currently only on Guardrails page)
