import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { lookupByApiKey, updateVault } from './register/route'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

// ─── Config ───
const VENICE_URL = 'https://api.venice.ai/api/v1/chat/completions'
const MODEL = 'zai-org-glm-4.7'

function getVeniceKey(): string | null {
  try {
    return readFileSync('/home/ubuntu/.openclaw/credentials/.venice-api-key', 'utf-8').trim()
  } catch {
    return process.env.VENICE_API_KEY || null
  }
}

// ─── Tool definitions (only Venice sees these) ───
const TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'check_vault',
      description: 'Check vault balances (ETH, WETH, USDC), on-chain policy status, and daily spending limits. Use when user asks about their vault, balance, holdings, portfolio, or policy.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_rates',
      description: 'Get live market data: ETH price, Lido stETH APR, Base gas price. Use for any market, price, rate, or yield question.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'swap',
      description: 'Execute a token swap through the vault via Uniswap V3. On-chain policy is enforced — if the swap exceeds limits, the transaction reverts. Supported pairs: WETH↔USDC.',
      parameters: {
        type: 'object',
        properties: {
          tokenIn: { type: 'string', enum: ['WETH', 'USDC'], description: 'Token to sell' },
          tokenOut: { type: 'string', enum: ['WETH', 'USDC'], description: 'Token to buy' },
          amount: { type: 'string', description: 'Amount of tokenIn to swap (e.g. "0.001")' },
        },
        required: ['tokenIn', 'tokenOut', 'amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'deposit',
      description: 'Deposit ETH into the vault. Wraps ETH to WETH and transfers to vault.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'string', description: 'Amount of ETH to deposit (e.g. "0.01")' },
        },
        required: ['amount'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'generate_strategy',
      description: 'Generate DeFi strategies based on current vault state and market conditions. Venice AI analyzes the portfolio and proposes strategies with guardrails. Use when user asks for strategy advice, wants to rebalance, or asks what to do with their money.',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: 'Optional specific request (e.g. "conservative strategy" or "maximize yield")' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_activity',
      description: 'Get recent vault transaction history and swap activity.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_yield',
      description: 'Check vault principal deposited and available yield above principal.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_vault',
      description: 'Create a new vault if one does not exist yet. Sets default policy (0.5 ETH max per trade, 1 ETH daily limit) and approves WETH+USDC.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_strategy',
      description: 'Get the currently active strategy for this vault — what the agent is supposed to be doing, including steps, guardrails, and when it was activated.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_strategy',
      description: 'Save a new active strategy for the vault. Use after generating a strategy the user approves. Includes name, description, steps, and guardrails.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Strategy name (e.g. "Conservative Yield")' },
          description: { type: 'string', description: 'Plain English description of what the agent will do' },
          expectedYield: { type: 'string', description: 'Expected yield range (e.g. "2-4% APR")' },
          steps: { type: 'array', items: { type: 'string' }, description: 'What the agent will actively do' },
          guardrails: {
            type: 'object',
            properties: {
              maxTradeSize: { type: 'string' },
              dailyLimit: { type: 'string' },
              protocols: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        required: ['name', 'description', 'steps', 'guardrails'],
      },
    },
  },
]

const SYSTEM_PROMPT = `You are MoltFi, a private DeFi vault manager on Base.

How it works:
- Human registers → vault is created automatically with on-chain spending policy
- You manage their vault: check balances, generate strategies, execute swaps
- All reasoning is private (Venice AI, zero data retention). All trades are public blockchain transactions.
- The smart contract enforces spending limits — you cannot exceed them even if you try
- Supported: WETH↔USDC swaps via Uniswap V3, ETH deposits, strategy generation

Rules:
- Always use tools to get real data. Never guess balances or prices.
- For swaps: confirm what the user wants, then execute.
- Be concise — 1-3 sentences plus the relevant data.
- If a tool fails, explain clearly what went wrong.
- Include Basescan links for any transaction.
- When asked for strategies, use generate_strategy to get AI-powered analysis.
- After generating a strategy the user likes, use set_strategy to save it as the active strategy.
- When running autonomously, use get_strategy to know what you're supposed to be doing, then act on it.`

// ─── Tool execution ───
async function executeTool(name: string, args: any, origin: string, vault: string, apiKey: string): Promise<string> {
  try {
    switch (name) {
      case 'check_vault': {
        const res = await fetch(`${origin}/api/vault/status?vault=${vault}`)
        return await res.text()
      }
      case 'get_rates': {
        const res = await fetch(`${origin}/api/rates`)
        return await res.text()
      }
      case 'swap': {
        const res = await fetch(`${origin}/api/vault/swap`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tokenIn: args.tokenIn, tokenOut: args.tokenOut, amount: args.amount }),
        })
        return await res.text()
      }
      case 'deposit': {
        const res = await fetch(`${origin}/api/vault/deposit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: args.amount }),
        })
        return await res.text()
      }
      case 'generate_strategy': {
        // Get vault balances first for context
        let balances = null
        try {
          const statusRes = await fetch(`${origin}/api/vault/status?vault=${vault}`)
          const statusData = await statusRes.json()
          balances = statusData.balances
        } catch {}

        const res = await fetch(`${origin}/api/pipeline`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            balances,
            prompt: args.prompt || 'Generate 3 strategies: safe, balanced, and aggressive.',
          }),
        })
        return await res.text()
      }
      case 'get_activity': {
        const res = await fetch(`${origin}/api/vault/activity?vault=${vault}`)
        return await res.text()
      }
      case 'get_yield': {
        const res = await fetch(`${origin}/api/vault/yield?vault=${vault}`)
        return await res.text()
      }
      case 'create_vault': {
        const res = await fetch(`${origin}/api/vault/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ maxPerTrade: '0.5', dailyLimit: '1' }),
        })
        const data = await res.json()
        if (data.vault) {
          updateVault(apiKey, data.vault)
        }
        return JSON.stringify(data)
      }
      case 'get_strategy': {
        const res = await fetch(`${origin}/api/vault/strategy?vault=${vault}`)
        return await res.text()
      }
      case 'set_strategy': {
        const res = await fetch(`${origin}/api/vault/strategy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vault, strategy: args }),
        })
        return await res.text()
      }
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` })
    }
  } catch (err: any) {
    return JSON.stringify({ error: err.message })
  }
}

// ─── Main endpoint ───
export async function POST(req: NextRequest) {
  const veniceKey = getVeniceKey()
  if (!veniceKey) {
    return NextResponse.json({ error: 'Venice API key not configured' }, { status: 503 })
  }

  // Authenticate
  const authHeader = req.headers.get('authorization') || ''
  const apiKey = authHeader.replace(/^Bearer\s+/i, '').trim()

  if (!apiKey) {
    return NextResponse.json({
      error: 'API key required. Register at POST /api/agent/register with {"humanWallet": "0x..."} to get one.',
    }, { status: 401 })
  }

  const registration = lookupByApiKey(apiKey)
  if (!registration) {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 403 })
  }

  const vault = registration.vault

  try {
    const body = await req.json()
    const message = body.message || body.prompt || ''

    if (!message) {
      return NextResponse.json({ error: 'Send a message. Example: {"message": "check my vault"}' }, { status: 400 })
    }

    const origin = req.nextUrl.origin

    const messages: any[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPT + (vault ? `\n\nActive vault: ${vault}` : '\n\nNo vault yet — if the user wants to trade, use create_vault first.'),
      },
      { role: 'user', content: message },
    ]

    // Step 1: Ask Venice what to do
    const response = await fetch(VENICE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${veniceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        tools: TOOLS,
        tool_choice: 'auto',
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Venice error: ${response.status}` }, { status: 502 })
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    // No tool call — just text
    if (choice?.finish_reason !== 'tool_calls' || !choice?.message?.tool_calls?.length) {
      return NextResponse.json({
        reply: choice?.message?.content || 'No response',
        model: data.model,
        provider: 'venice',
        dataRetention: 'none',
        toolCalled: null,
      })
    }

    // Step 2: Execute tool call
    const toolCall = choice.message.tool_calls[0]
    const toolName = toolCall.function.name
    let toolArgs: any = {}
    try {
      toolArgs = JSON.parse(toolCall.function.arguments || '{}')
    } catch {}

    const toolResult = await executeTool(toolName, toolArgs, origin, vault, apiKey)

    // Step 3: Send result back to Venice for summary
    const followupMessages = [
      ...messages,
      choice.message,
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolName,
        content: toolResult,
      },
    ]

    const followup = await fetch(VENICE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${veniceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: MODEL, messages: followupMessages }),
    })

    if (!followup.ok) {
      return NextResponse.json({
        reply: toolResult,
        model: data.model,
        provider: 'venice',
        dataRetention: 'none',
        toolCalled: toolName,
      })
    }

    const followupData = await followup.json()
    const finalReply = followupData.choices?.[0]?.message?.content || toolResult

    return NextResponse.json({
      reply: finalReply,
      model: followupData.model || data.model,
      provider: 'venice',
      dataRetention: 'none',
      toolCalled: toolName,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
