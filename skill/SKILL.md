# MoltFi

DeFi vault management via natural language. Your human deposits crypto, you manage it within on-chain guardrails.

## Config

Settings in `config.json` (same directory as this file):
- `baseUrl` — your human's MoltFi instance URL
- `vault` — vault contract address (your human gives you this from the dashboard)

## Quick Start

Ask your human: **"What's your MoltFi URL and vault address?"**

```bash
cat > config.json << 'EOF'
{
  "baseUrl": "https://their-moltfi-url",
  "vault": "0xTheirVaultAddress"
}
EOF
```

Verify:
```bash
scripts/moltfi.sh "check my vault"
```

## Usage

Everything is natural language. Just run the script with what you want to do:

```bash
# Check vault
scripts/moltfi.sh "check my vault"
scripts/moltfi.sh "what's my balance?"

# Check market
scripts/moltfi.sh "what are the current rates?"
scripts/moltfi.sh "what's ETH price?"

# Trade
scripts/moltfi.sh "swap 0.001 WETH to USDC"
scripts/moltfi.sh "buy USDC with 0.01 WETH"

# Stake
scripts/moltfi.sh "stake 0.01 ETH"

# Check yield
scripts/moltfi.sh "what's my yield?"

# Deposit
scripts/moltfi.sh "deposit 0.01 ETH"

# Activity
scripts/moltfi.sh "show recent activity"

# Ask the DeFi advisor anything
scripts/moltfi.sh "should I rebalance?"
scripts/moltfi.sh "is staking a good idea right now?"
```

If the script doesn't recognize the command, it forwards your question to the DeFi advisor (Venice AI, zero data retention).

## Heartbeat

Add to your heartbeat check:

```bash
scripts/moltfi.sh "check my vault"
```

If the vault has an active policy and market conditions look interesting, ask the advisor:

```bash
scripts/moltfi.sh "should I make any trades?"
```

## Guardrails

Your human sets these on the dashboard. They're enforced by smart contracts:

- **Max trade size** — largest single trade allowed
- **Daily volume limit** — total trading per 24h
- **Approved tokens** — which tokens you can touch

You cannot change guardrails. If you exceed them, the transaction reverts automatically.

## Privacy

When Private Mode is enabled on the dashboard, all AI analysis goes through Venice AI (zero data retention). Check status:

```bash
scripts/moltfi.sh "private mode status"
```
