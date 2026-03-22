# MoltFi — Roadmap

*AI vault manager for DeFi. Your agent manages your money within on-chain guardrails.*

**Repo:** `~/repos/agentguard/` | **App:** `http://100.71.117.120:3002` | **Chain:** Base Sepolia (84532)

---

## Product

**Problem:** People have crypto doing nothing because DeFi is too complicated, and they don't trust anyone else to manage it.

**Solution:** Your own AI agent manages your DeFi portfolio. You control what it can touch and how much. It figures out the best strategy using private inference (Venice AI). Nobody else sees your financial data.

**How it works:**
1. Human connects wallet → creates vault (one TX) → deposits ETH
2. Human sends skill file to their AI agent → agent registers
3. Venice AI proposes strategies with guardrails baked in → human picks one
4. Agent runs autonomously on heartbeat — trades within on-chain limits
5. Human monitors on dashboard, can pause anytime (revokes policy on-chain)

**Key differentiators:**
- Non-custodial: funds in your vault smart contract, not our servers
- On-chain enforcement: agent physically can't exceed limits (TX reverts)
- Private analysis: Venice AI, zero data retention
- Agent-agnostic: any AI agent that can make HTTP calls works

---

## Architecture

### Smart Contracts (all deployed on Base Sepolia)

| Contract | Address | Purpose |
|----------|---------|---------|
| VaultFactory | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` | One-TX vault deploy + policy + token approval |
| AgentPolicy | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` | Per-agent limits, daily caps, token allowlist |
| AgentGuardRouter | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` | Wraps Uniswap V3, checks policy before every swap |
| AgentVault (demo) | `0x333896c4c1b58c5c9b56967301c008C073Bd2279` | Holds funds, tracks principal vs yield |

**Flow:** Agent → Vault.executeSwap() → Router.swap() → Policy.enforceAndRecord() → Uniswap V3
If policy fails → TX reverts. Agent can't bypass.

**Verified swap:** [0x1abcce6a...](https://sepolia.basescan.org/tx/0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1) — 0.005 WETH → 2.045 USDC through the full guardrail pipeline.

### Web App (Next.js)

| Tab | URL | What it does |
|-----|-----|-------------|
| Vault | `/dashboard` | Overview, balances, deposit/withdraw, strategy status |
| Strategy | `/strategy` | AI generates strategies, approve & start agent, pause |
| Guardrails | `/guardrails` | On-chain limits, token allowlist, Private Mode toggle |
| Activity | `/activity` | Trade history from blockchain events, Basescan links |
| DeFi Agent | `/chat` | Chat with advisor + connect-your-agent instructions |

### API Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /api/rates` | ✅ | ETH price (CoinGecko + Coinbase fallback), Lido APR, Base gas |
| `GET /api/vault/status` | ✅ | Real on-chain balances + policy |
| `GET /api/vault/activity` | ✅ | Real on-chain events |
| `GET /api/vault/performance` | ✅ | Trade P&L, realistic return calc |
| `GET /api/vault/yield` | ✅ | Principal vs available yield |
| `GET/POST /api/vault/private-mode` | ✅ | Toggle per vault |
| `POST /api/vault/deposit` | ✅ | Deposits ETH (needs auth) |
| `POST /api/vault/swap` | 🟡 | Nonce issues, needs auth |
| `POST /api/vault/stake` | 🔴 | Owner check broken |
| `POST /api/chat` | ✅ | Venice AI, private mode enforced |
| `POST /api/pipeline` | ✅ | Venice strategy gen, private mode enforced |
| `GET /api/skill` | ✅ | Serves skill file |
| `GET /api/policy` | ✅ | Live on-chain policy |
| `POST /api/agent/register` | ✅ | Agent registration |
| `POST /api/uniswap/quote` | ✅ | Uniswap Trading API proxy |

### Agent Skill (`skill/SKILL.md`)

One file teaches any AI agent all of MoltFi: register, check vault, trade, stake, heartbeat monitoring. Served at `/api/skill`. Works with OpenClaw, custom agents, anything that makes HTTP calls.

---

## Hackathon (Synthesis 2026)

- **Building:** March 13–22 | **Winners:** March 25
- **Participant ID:** `0824fdafe6694fd9a186cb9ca1d4dd4b`
- **Team ID:** `c3ba0334c6d7479ebd8a88b996ea66ed`
- **ERC-8004:** Token #34950
- **⚠️ Cloudflare blocks our VPS** — all submission API calls from Rodrigo's Mac

### Target Tracks

| Track | Sponsor | Prize | Fit |
|-------|---------|-------|-----|
| Open Track | Community | $28,134 | Always submit |
| Private Agents | Venice | $5,750/$3,450/$2,300 | Venice private inference, enforced |
| Agentic Finance | Uniswap | $2,500/$1,500/$1,000 | Router + verified swap + Trading API |
| Autonomous Trading Agent | Base | 3x ~$1,667 | Vault+policy = novel trading framework |
| stETH Agent Treasury | Lido | $2,000/$1,000 | **Exact match** — principal locked, yield tradeable |
| ERC-8004 Agents With Receipts | Protocol Labs | $2,000/$1,500/$500 | Token #34950 minted |

### Submission Status
- [x] Registration complete
- [x] ERC-8004 minted
- [x] Repo created (github.com/ortegarod/agentguard)
- [ ] Push code + make public
- [ ] Write conversationLog
- [ ] Submit via Devfolio API (from Rodrigo's Mac)

---

## Audit (March 22, 2026)

### 🔴 Must Fix

1. **Chat system prompt claims Aave & Uniswap LP** — we only have Uniswap swaps + Lido staking
2. **Landing page lists ENS, Celo, ERC-8004** as integrated tech — they're not meaningfully integrated
3. **wstETH has zero address** `0x000...000` on guardrails page — would approve zero address on-chain
4. **Dead `/api/register` endpoint** — duplicate of `/api/agent/register`
5. **`/api/vault/stake` broken** — "not owner" error, signs from wrong wallet
6. **`/api/vault/swap` nonce issues** — "replacement transaction underpriced"

### 🟡 Should Fix

7. **No API auth on swap/deposit** — anyone who knows vault address can trigger transactions
8. **Strategy switch has no confirmation** — doesn't explain it will revoke old + set new policy
9. **Private Mode only toggleable from Guardrails page** — should be accessible from header indicator

### ✅ Fixed This Session

- Strategy page uses on-chain policy as source of truth (not localStorage)
- Overview section: realistic return numbers, no more 514,453% APR
- ETH price: Coinbase fallback when CoinGecko rate-limits
- Private mode enforced in chat + pipeline APIs (503 if Venice is down)
- "Change Strategy" navigation fixed (back button, doesn't nuke active state)
- Vault page shows strategy status bar
- Privacy copy corrected (strategies cached in browser, not "never stored")
- Rebranded AgentGuard → MoltFi

---

## TODO (Priority Order)

1. [ ] Remove false claims from landing page (Aave, ENS, Celo, ERC-8004)
2. [ ] Fix chat system prompt — only Lido staking + Uniswap swaps
3. [ ] Fix wstETH zero address on guardrails page
4. [ ] Delete dead `/api/register` endpoint
5. [ ] Install Venice as OpenClaw model provider → test agent-to-agent flow
6. [ ] Add basic auth to swap/deposit API endpoints
7. [ ] Fix `/api/vault/stake` owner check
8. [ ] Fix `/api/vault/swap` nonce management
9. [ ] Add strategy switch confirmation
10. [ ] Private Mode toggle from header indicator

---

## Design Rules

1. **No mock data.** Real API/RPC/chain or show nothing. Violated 3 times — no more.
2. **Agent never sets its own guardrails.** Human sets limits. Agent operates within them.
3. **User doesn't know DeFi.** AI proposes strategies in plain English. No slippage sliders.
4. **Agent runs autonomously.** Heartbeat-driven, not prompt-driven. Dashboard shows what it's doing.
5. **One app, one directory, one port.** `~/repos/agentguard/app/` on port 3002.
6. **Private Mode = Venice only.** When enabled, all inference through Venice. No fallbacks.

---

## Key Files

| What | Path |
|------|------|
| Roadmap | `~/repos/agentguard/ROADMAP.md` |
| Contracts | `~/repos/agentguard/contracts/src/` |
| Web app | `~/repos/agentguard/app/` |
| Agent skill | `~/repos/agentguard/skill/SKILL.md` |
| Venice API key | `~/.openclaw/credentials/.venice-api-key` |
| Wallet key | `~/.openclaw/credentials/.kyro-wallet-key` |
| Hackathon API key | `~/.openclaw/credentials/.synthesis-api-key` |

---

## Key Addresses

| What | Address |
|------|---------|
| VaultFactory | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` |
| AgentPolicy | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` |
| AgentGuardRouter | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` |
| Kyro wallet | `0x90d9c75f3761c02Bf3d892A701846F6323e9112D` |
| WETH (Base Sepolia) | `0x4200000000000000000000000000000000000006` |
| USDC (Base Sepolia) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| User vault (demo) | `0xf8934f4c1508c6FB5F12FF8Af37990447E81300b` |
