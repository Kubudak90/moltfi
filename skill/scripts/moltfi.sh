#!/bin/bash
# MoltFi — DeFi agent skill wrapper
# Usage: moltfi.sh "<natural language prompt>"
# Examples:
#   moltfi.sh "check my vault"
#   moltfi.sh "what are the current rates?"
#   moltfi.sh "swap 0.001 WETH to USDC"
#   moltfi.sh "stake 0.01 ETH"
#   moltfi.sh "what's my yield?"
#   moltfi.sh "should I rebalance?"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config.json"

# Load config
if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: config.json not found at $CONFIG_FILE" >&2
  echo "Create it with: {\"baseUrl\": \"https://your-moltfi-url\", \"vault\": \"0xYourVault\"}" >&2
  exit 1
fi

BASE_URL=$(jq -r '.baseUrl // empty' "$CONFIG_FILE")
VAULT=$(jq -r '.vault // empty' "$CONFIG_FILE")

if [ -z "$BASE_URL" ]; then
  echo "ERROR: baseUrl not set in config.json" >&2
  exit 1
fi

if [ -z "$VAULT" ]; then
  echo "ERROR: vault not set in config.json" >&2
  exit 1
fi

PROMPT="${1:-}"
if [ -z "$PROMPT" ]; then
  echo "Usage: moltfi.sh \"<natural language prompt>\"" >&2
  exit 1
fi

# Normalize prompt to lowercase for matching
LP=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

# ─── Route based on intent ───

# Private mode (check before vault since "status" matches both)
if echo "$LP" | grep -qE '(private|privacy|private mode)'; then
  RESULT=$(curl -sf "$BASE_URL/api/vault/private-mode?vault=$VAULT")
  PM=$(echo "$RESULT" | jq -r '.privateMode // false')
  if [ "$PM" = "true" ]; then
    echo "Private Mode: ON — all AI inference through Venice (zero data retention)"
  else
    echo "Private Mode: OFF — toggle on the dashboard under Guardrails"
  fi
  exit 0
fi

# Check vault / balance / status (but not "rebalance" or "private...status")
if echo "$LP" | grep -qE '(vault|balance[s]?$|check.*(status|balance)|portfolio|how much|holdings|my balance)' && ! echo "$LP" | grep -qE 'rebalance'; then
  RESULT=$(curl -sf "$BASE_URL/api/vault/status?vault=$VAULT")
  ETH=$(echo "$RESULT" | jq -r '.balances.ETH // "0"')
  WETH=$(echo "$RESULT" | jq -r '.balances.WETH // "0"')
  USDC=$(echo "$RESULT" | jq -r '.balances.USDC // "0"')
  ACTIVE=$(echo "$RESULT" | jq -r '.policy.active // false')
  MAX=$(echo "$RESULT" | jq -r '.policy.maxPerAction // "0"')
  DAILY=$(echo "$RESULT" | jq -r '.policy.dailyLimit // "0"')
  SPENT=$(echo "$RESULT" | jq -r '.policy.dailySpent // "0"')
  REMAINING=$(echo "$RESULT" | jq -r '.policy.remaining // "0"')

  echo "Vault: $VAULT"
  echo "Balances: $ETH ETH, $WETH WETH, $USDC USDC"
  echo "Policy active: $ACTIVE"
  if [ "$ACTIVE" = "true" ]; then
    echo "Max per trade: $MAX ETH | Daily limit: $DAILY ETH | Spent today: $SPENT ETH | Remaining: $REMAINING ETH"
  fi
  exit 0
fi

# Check rates / market / prices
if echo "$LP" | grep -qE '(rate|market|price|eth price|lido|apr|yield rate|gas)'; then
  RESULT=$(curl -sf "$BASE_URL/api/rates")
  ETH_PRICE=$(echo "$RESULT" | jq -r '.prices.eth // "unavailable"')
  ETH_CHANGE=$(echo "$RESULT" | jq -r '.prices.eth24hChange // "0"')
  LIDO=$(echo "$RESULT" | jq -r '.lido.smaApr // "unavailable"')
  GAS=$(echo "$RESULT" | jq -r '.baseGas.gwei // "unavailable"')

  echo "ETH: \$$ETH_PRICE (${ETH_CHANGE}% 24h)"
  echo "Lido stETH APR: ${LIDO}%"
  echo "Base gas: ${GAS} gwei"
  exit 0
fi

# Check yield
if echo "$LP" | grep -qE '(yield|principal|available yield)'; then
  RESULT=$(curl -sf "$BASE_URL/api/vault/yield?vault=$VAULT")
  PRINCIPAL=$(echo "$RESULT" | jq -r '.principal // "0"')
  YIELD=$(echo "$RESULT" | jq -r '.availableYield // "0"')

  echo "Principal: $PRINCIPAL ETH"
  echo "Available yield: $YIELD ETH"
  exit 0
fi

# Swap
if echo "$LP" | grep -qE '(swap|convert|trade|sell|buy)'; then
  # Extract amount and tokens from natural language
  # Pattern: "swap 0.001 WETH to USDC" or "buy USDC with 0.01 WETH"
  AMOUNT=$(echo "$PROMPT" | grep -oE '[0-9]+\.?[0-9]*' | head -1)
  
  # Figure out tokenIn and tokenOut
  if echo "$LP" | grep -qE 'weth.*(to|for|into).*usdc|sell.*weth|buy.*usdc'; then
    TOKEN_IN="WETH"
    TOKEN_OUT="USDC"
  elif echo "$LP" | grep -qE 'usdc.*(to|for|into).*weth|sell.*usdc|buy.*weth|buy.*eth'; then
    TOKEN_IN="USDC"
    TOKEN_OUT="WETH"
  else
    echo "Couldn't determine tokens. Try: \"swap 0.001 WETH to USDC\"" >&2
    exit 1
  fi

  if [ -z "$AMOUNT" ]; then
    echo "Couldn't determine amount. Try: \"swap 0.001 WETH to USDC\"" >&2
    exit 1
  fi

  echo "Swapping $AMOUNT $TOKEN_IN → $TOKEN_OUT..." >&2
  RESULT=$(curl -sf -X POST "$BASE_URL/api/vault/swap" \
    -H "Content-Type: application/json" \
    -d "{\"tokenIn\":\"$TOKEN_IN\",\"tokenOut\":\"$TOKEN_OUT\",\"amount\":\"$AMOUNT\"}")

  if echo "$RESULT" | jq -e '.error' >/dev/null 2>&1; then
    echo "Swap failed: $(echo "$RESULT" | jq -r '.error')" >&2
    exit 1
  fi

  TX=$(echo "$RESULT" | jq -r '.txHash // "pending"')
  echo "✓ Swapped $AMOUNT $TOKEN_IN → $TOKEN_OUT"
  echo "TX: https://sepolia.basescan.org/tx/$TX"
  exit 0
fi

# Stake
if echo "$LP" | grep -qE '(stake|staking|lido|steth)'; then
  AMOUNT=$(echo "$PROMPT" | grep -oE '[0-9]+\.?[0-9]*' | head -1)
  if [ -z "$AMOUNT" ]; then
    echo "Couldn't determine amount. Try: \"stake 0.01 ETH\"" >&2
    exit 1
  fi

  echo "Staking $AMOUNT ETH via Lido..." >&2
  RESULT=$(curl -sf -X POST "$BASE_URL/api/vault/stake" \
    -H "Content-Type: application/json" \
    -d "{\"amount\":\"$AMOUNT\"}")

  if echo "$RESULT" | jq -e '.error' >/dev/null 2>&1; then
    echo "Stake failed: $(echo "$RESULT" | jq -r '.error')" >&2
    exit 1
  fi

  TX=$(echo "$RESULT" | jq -r '.txHash // "pending"')
  echo "✓ Staked $AMOUNT ETH → stETH → wstETH"
  echo "TX: https://sepolia.basescan.org/tx/$TX"
  exit 0
fi

# Deposit
if echo "$LP" | grep -qE '(deposit|add funds|fund)'; then
  AMOUNT=$(echo "$PROMPT" | grep -oE '[0-9]+\.?[0-9]*' | head -1)
  if [ -z "$AMOUNT" ]; then
    echo "Couldn't determine amount. Try: \"deposit 0.01 ETH\"" >&2
    exit 1
  fi

  echo "Depositing $AMOUNT ETH into vault..." >&2
  RESULT=$(curl -sf -X POST "$BASE_URL/api/vault/deposit" \
    -H "Content-Type: application/json" \
    -d "{\"amount\":\"$AMOUNT\"}")

  if echo "$RESULT" | jq -e '.error' >/dev/null 2>&1; then
    echo "Deposit failed: $(echo "$RESULT" | jq -r '.error')" >&2
    exit 1
  fi

  TX=$(echo "$RESULT" | jq -r '.txHash // "pending"')
  echo "✓ Deposited $AMOUNT ETH"
  echo "TX: https://sepolia.basescan.org/tx/$TX"
  exit 0
fi

# Activity / history
if echo "$LP" | grep -qE '(activity|history|trades|transactions|recent)'; then
  RESULT=$(curl -sf "$BASE_URL/api/vault/activity?vault=$VAULT")
  COUNT=$(echo "$RESULT" | jq -r '.count // 0')
  echo "Recent activity ($COUNT total):"
  echo "$RESULT" | jq -r '.activities[]? | "  \(.summary) — https://sepolia.basescan.org/tx/\(.txHash[0:10])..."'
  exit 0
fi

# Ask the DeFi advisor (anything else → Venice)
echo "Asking DeFi advisor..." >&2

# Get current context
RATES=$(curl -sf "$BASE_URL/api/rates" 2>/dev/null || echo "{}")
STATUS=$(curl -sf "$BASE_URL/api/vault/status?vault=$VAULT" 2>/dev/null || echo "{}")

CONTEXT="Current vault: $(echo "$STATUS" | jq -r '.balances // {} | to_entries | map("\(.key): \(.value)") | join(", ")' 2>/dev/null || echo 'unknown'). ETH price: \$$(echo "$RATES" | jq -r '.prices.eth // "unknown"' 2>/dev/null). Lido APR: $(echo "$RATES" | jq -r '.lido.smaApr // "unknown"' 2>/dev/null)%."

RESULT=$(curl -sf -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg prompt "$PROMPT" --arg ctx "$CONTEXT" --arg vault "$VAULT" '{
    vault: $vault,
    messages: [
      {role: "user", content: ($ctx + "\n\nUser asks: " + $prompt)}
    ]
  }')")

REPLY=$(echo "$RESULT" | jq -r '.reply // "No response from advisor"')
PROVIDER=$(echo "$RESULT" | jq -r '.provider // "unknown"')
PM=$(echo "$RESULT" | jq -r '.privateMode // false')

echo "$REPLY"
echo ""
echo "[provider: $PROVIDER | private mode: $PM]"
