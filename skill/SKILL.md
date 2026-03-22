# MoltFi — AI DeFi Vault Manager

MoltFi manages DeFi vaults on Base with on-chain spending policy enforcement. Venice AI (private inference, zero data retention) powers all strategy and reasoning. Uniswap V3 executes trades. Smart contracts enforce limits — the agent cannot exceed them.

## Quick Start

### 1. Register (one time)

```bash
curl -X POST https://moltfi.app/api/agent/register \
  -H "Content-Type: application/json" \
  -d '{"humanWallet": "0xYOUR_WALLET", "agentName": "MyAgent"}'
```

Response includes your `apiKey` and `vault` address. Save the API key — you'll need it for every request.

Registration automatically creates a vault with default policy (0.5 ETH max per trade, 1 ETH daily limit, WETH+USDC approved).

### 2. Talk to MoltFi (every interaction)

```bash
curl -X POST https://moltfi.app/api/agent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"message": "check my vault"}'
```

That's it. Send any message in plain English. MoltFi's AI agent figures out what to do.

### Examples

```bash
# Check balances and policy
{"message": "check my vault"}

# Get market data
{"message": "what are the current rates?"}

# Execute a swap (policy enforced on-chain)
{"message": "swap 0.001 WETH to USDC"}

# Deposit ETH
{"message": "deposit 0.01 ETH"}

# Get strategy advice
{"message": "what strategy should I use?"}

# Ask anything
{"message": "should I rebalance my portfolio?"}
```

### Response Format

```json
{
  "reply": "Your vault holds 0.03 ETH, 0.004 WETH, 0.94 USDC...",
  "model": "zai-org-glm-4.7",
  "provider": "venice",
  "dataRetention": "none",
  "toolCalled": "check_vault"
}
```

## Bash Script

For agents that prefer a script:

```bash
# Install
curl -o moltfi.sh https://moltfi.app/api/skill/script
chmod +x moltfi.sh

# Configure
echo '{"baseUrl": "https://moltfi.app", "apiKey": "mf_YOUR_KEY"}' > config.json

# Use
./moltfi.sh "check my vault"
./moltfi.sh "swap 0.001 WETH to USDC"
./moltfi.sh "what strategy should I use?"
```

## How It Works

1. **You register** → vault created on Base with spending policy
2. **You send a message** → MoltFi's AI agent (Venice, private inference) decides what to do
3. **Agent calls tools** → check vault, get rates, swap tokens, generate strategies
4. **Smart contracts enforce** → AgentPolicy checks every trade against limits. Exceeds limits? Transaction reverts.
5. **You get a response** → plain English summary with Basescan links

## Architecture

- **AgentPolicy** — on-chain spending limits (max per trade, daily cap). Human sets. Agent can't change.
- **AgentGuardRouter** — wraps Uniswap V3. Checks policy before every swap.
- **AgentVault** — holds funds. Only the agent can trade (through the router). Only the human can withdraw.
- **Venice AI** — private inference, zero data retention. All strategy reasoning is private. All trades are public blockchain transactions.

## Sponsor Tech

- **Venice AI** — private strategy generation and reasoning (zero data retention)
- **Uniswap V3** — token swaps via AgentGuardRouter (Trading API for quotes)
- **Lido** — stETH APR data, vault supports staking (stakeETH → wstETH, principal tracking)
- **Base** — all contracts deployed on Base Sepolia
- **ERC-8004** — on-chain agent identity

## OpenClaw Integration

Add to your agent's HEARTBEAT.md for autonomous vault monitoring:

```markdown
## MoltFi Vault Check
- Run: `moltfi.sh "check my vault and current rates"`
- If ETH dropped >5% and holding WETH: `moltfi.sh "swap all WETH to USDC"`
- If ETH rose >5% and holding USDC: `moltfi.sh "swap half USDC to WETH"`
```

## Contracts (Base Sepolia)

| Contract | Address |
|----------|---------|
| VaultFactory | `0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774` |
| AgentPolicy | `0x63649f61F29CE6dC9415263F4b727Bc908206Fbc` |
| AgentGuardRouter | `0x5Cc04847CE5A81319b55D34F9fB757465D3677E6` |

## Links

- Dashboard: https://moltfi.app
- GitHub: https://github.com/ortegarod/moltfi
