import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'

export const dynamic = 'force-dynamic'

// Venice API — OpenAI-compatible
const VENICE_URL = 'https://api.venice.ai/api/v1/chat/completions'

function getApiKey(): string | null {
  try {
    return readFileSync('/home/ubuntu/.openclaw/credentials/.venice-api-key', 'utf-8').trim()
  } catch {
    return process.env.VENICE_API_KEY || null
  }
}

// Fetch real market data from our existing API routes
async function getMarketContext(origin: string): Promise<string> {
  try {
    const [ratesRes, policyRes] = await Promise.all([
      fetch(`${origin}/api/rates`).then(r => r.json()).catch(() => null),
      fetch(`${origin}/api/policy`).then(r => r.json()).catch(() => null),
    ])

    const parts: string[] = []

    if (ratesRes?.prices) {
      parts.push(`ETH price: $${ratesRes.prices.eth.toLocaleString()} (${ratesRes.prices.eth24hChange >= 0 ? '+' : ''}${ratesRes.prices.eth24hChange.toFixed(2)}% 24h)`)
    }
    if (ratesRes?.lido) {
      parts.push(`Lido stETH APR: ${ratesRes.lido.smaApr.toFixed(2)}%`)
    }
    if (ratesRes?.baseGas) {
      parts.push(`Base gas: ${ratesRes.baseGas.gwei} gwei`)
    }
    if (policyRes?.policy) {
      parts.push(`Current on-chain policy: max trade ${policyRes.policy.maxPerAction} ETH, daily limit ${policyRes.policy.dailyLimit} ETH, status: ${policyRes.policy.active ? 'active' : 'inactive'}`)
      parts.push(`Today's volume: ${policyRes.dailySpent} ETH / ${policyRes.policy.dailyLimit} ETH`)
    }

    return parts.length > 0 ? parts.join('\n') : 'Market data unavailable'
  } catch {
    return 'Market data unavailable'
  }
}

const SYSTEM_PROMPT = `You are MoltFi's AI vault advisor. You guide users who have NO financial knowledge through setting up a DeFi strategy. You do all the thinking — they just answer simple questions and approve.

CURRENT MARKET DATA (real-time):
{MARKET_DATA}

AVAILABLE PROTOCOLS & CURRENT YIELDS:
- Lido: ETH staking → liquid staking token (stETH). Use the real APR from market data above.
- Uniswap V3: Liquidity provision (ETH/USDC pairs). Variable yield based on trading volume.
- Aave: USDC lending. ~3-5% APR typically.
- Wallet: Keep liquid ETH for flexibility. 0% yield but instant access.

YOUR BEHAVIOR — YOU LEAD, THEY FOLLOW:
- Your FIRST message: Share a quick market snapshot using real data, then ask "How much ETH are you looking to put to work?"
- After they answer: Ask ONE question — "Would you rather play it safe with steady returns, or go for higher yields with more risk?"
- After they answer: Immediately present a COMPLETE strategy. Don't ask more questions. Just propose.
- If they approve or say anything positive: Output the strategy JSON block.
- If they want changes: Adjust and re-propose. Don't ask what they want changed — suggest the adjustment.

STRATEGY OUTPUT FORMAT — use this when presenting a strategy:
\`\`\`strategy
{
  "risk": "conservative|moderate|aggressive",
  "goal": "preserve|yield|growth",
  "allocation": [
    {"protocol": "Lido", "percentage": 40, "action": "Stake ETH for ~X% APR"},
    {"protocol": "Uniswap", "percentage": 30, "action": "ETH/USDC liquidity"},
    {"protocol": "Aave", "percentage": 20, "action": "Lend USDC"},
    {"protocol": "Wallet", "percentage": 10, "action": "Keep liquid"}
  ],
  "guardrails": {
    "maxTradeSize": 1.0,
    "dailyVolumeLimit": 5.0
  }
}
\`\`\`

CRITICAL RULES:
- Maximum 2 questions before proposing a strategy. The user came here to get help, not take a quiz.
- Keep responses under 100 words. Be direct.
- Use real numbers from market data — never make up prices or yields.
- Explain things simply. No jargon. "Staking" = "locking up your ETH to earn interest." "LP" = "providing liquidity to earn trading fees."
- When showing the strategy, add a one-line explanation for each allocation so the user understands what their money is doing.
- Always include guardrails in the strategy. Set them conservatively — protect the user.
- If market data is unavailable, say so. Never fake numbers.`

export async function POST(req: NextRequest) {
  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json({
      error: 'Venice API key not configured. Ask your admin to add it.',
    }, { status: 503 })
  }

  try {
    const { messages } = await req.json()

    // Get real market data
    const origin = req.nextUrl.origin
    const marketData = await getMarketContext(origin)

    const systemPrompt = SYSTEM_PROMPT.replace('{MARKET_DATA}', marketData)

    const response = await fetch(VENICE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `Venice API error: ${response.status} ${err}` }, { status: 502 })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || 'No response from Venice'

    return NextResponse.json({ reply, model: data.model })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
