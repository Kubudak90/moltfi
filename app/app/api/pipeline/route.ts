import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

const VENICE_URL = 'https://api.venice.ai/api/v1/chat/completions'
const PM_PATH = join(process.cwd(), 'data', 'private-mode.json')

function getVeniceKey(): string | null {
  try {
    return readFileSync('/home/ubuntu/.openclaw/credentials/.venice-api-key', 'utf-8').trim()
  } catch {
    return process.env.VENICE_API_KEY || null
  }
}

function isPrivateMode(vault?: string): boolean {
  if (!vault) return false
  try {
    if (existsSync(PM_PATH)) {
      const data = JSON.parse(readFileSync(PM_PATH, 'utf-8'))
      return !!data[vault.toLowerCase()]
    }
  } catch {}
  return false
}

// POST — Agent requests strategy generation
// If Private Mode is active, this is the ONLY way to generate strategies (Venice enforced)
export async function POST(req: NextRequest) {
  const apiKey = getVeniceKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'Venice API not configured' }, { status: 503 })
  }

  try {
    const { vault, balances, prompt } = await req.json()

    // Get market data
    let marketData = 'Market data unavailable'
    try {
      const origin = req.nextUrl.origin
      const ratesRes = await fetch(`${origin}/api/rates`).then(r => r.json()).catch(() => null)
      if (ratesRes?.prices) {
        const parts = []
        parts.push(`ETH: $${ratesRes.prices.eth.toLocaleString()} (${ratesRes.prices.eth24hChange >= 0 ? '+' : ''}${ratesRes.prices.eth24hChange.toFixed(2)}% 24h)`)
        if (ratesRes.lido) parts.push(`Lido stETH APR: ${ratesRes.lido.smaApr.toFixed(2)}%`)
        if (ratesRes.baseGas) parts.push(`Base gas: ${ratesRes.baseGas.gwei} gwei`)
        marketData = parts.join(' | ')
      }
    } catch {}

    const systemPrompt = `You are an autonomous DeFi strategy agent for AgentGuard on Base.

MARKET DATA (live): ${marketData}
VAULT BALANCES: ${balances ? JSON.stringify(balances) : 'unknown'}

Generate a strategy the agent should execute. Be specific about actions.
Plain English — the user knows nothing about DeFi.

Return a strategy block:
\`\`\`strategy
{
  "name": "Strategy Name",
  "description": "What the agent will do",
  "expectedYield": "X-Y% APR",
  "steps": ["Step 1", "Step 2"],
  "guardrails": { "maxTradeSize": "0.5 ETH", "dailyLimit": "2 ETH", "protocols": ["Lido", "Uniswap"] }
}
\`\`\``

    const response = await fetch(VENICE_URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt || 'Generate 3 strategies: safe, balanced, and aggressive.' },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Venice error: ${response.status}` }, { status: 502 })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({
      reply,
      model: data.model,
      provider: 'venice',
      privateMode: isPrivateMode(vault),
      dataRetention: 'none',
      note: 'Strategy generated via Venice AI with zero data retention.',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET — Legacy pipeline info
export async function GET() {
  return NextResponse.json({
    pipeline: 'AgentGuard Strategy Pipeline',
    provider: 'Venice AI',
    model: 'llama-3.3-70b',
    dataRetention: 'none',
    note: 'All strategy generation routes through Venice with zero data retention. When Private Mode is active, this is the only allowed inference path.',
  })
}
