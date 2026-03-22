#!/bin/bash
# MoltFi — Talk to your DeFi vault manager
# Usage: moltfi.sh "<anything in natural language>"
#
# Examples:
#   moltfi.sh "check my vault"
#   moltfi.sh "swap 0.001 WETH to USDC"
#   moltfi.sh "what are the current rates?"
#   moltfi.sh "should I rebalance?"
#   moltfi.sh "deposit 0.01 ETH"
#
# Your API key identifies you. The agent knows your vault.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../config.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "ERROR: config.json not found at $CONFIG_FILE" >&2
  echo 'Create it: {"baseUrl": "https://moltfi.app", "apiKey": "mf_your_key_here"}' >&2
  exit 1
fi

BASE_URL=$(jq -r '.baseUrl // empty' "$CONFIG_FILE")
API_KEY=$(jq -r '.apiKey // empty' "$CONFIG_FILE")

if [ -z "$BASE_URL" ] || [ -z "$API_KEY" ]; then
  echo "ERROR: baseUrl and apiKey must be set in config.json" >&2
  exit 1
fi

MESSAGE="${1:-}"
if [ -z "$MESSAGE" ]; then
  echo "Usage: moltfi.sh \"<anything in natural language>\"" >&2
  exit 1
fi

# Send to MoltFi agent — it handles everything
RESULT=$(curl -sf --max-time 90 -X POST "$BASE_URL/api/agent" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "$(jq -n --arg msg "$MESSAGE" '{message: $msg}')")

# Print the agent's reply
echo "$RESULT" | jq -r '.reply // .error // "No response"'
