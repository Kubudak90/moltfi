import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'data', 'agents.json')

interface AgentRegistration {
  agentWallet: string
  humanWallet: string
  agentName: string
  platform: string
  registeredAt: string
}

function loadAgents(): AgentRegistration[] {
  try {
    if (existsSync(DB_PATH)) {
      return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
    }
  } catch {}
  return []
}

function saveAgents(agents: AgentRegistration[]) {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) {
    const { mkdirSync } = require('fs')
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(DB_PATH, JSON.stringify(agents, null, 2))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { agentWallet, humanWallet, agentName, platform } = body

    if (!agentWallet || !humanWallet) {
      return NextResponse.json(
        { error: 'agentWallet and humanWallet are required' },
        { status: 400 }
      )
    }

    const agents = loadAgents()

    // Check if agent already registered
    const existing = agents.find(
      a => a.agentWallet.toLowerCase() === agentWallet.toLowerCase()
    )

    if (existing) {
      // Update human wallet if changed
      existing.humanWallet = humanWallet
      existing.agentName = agentName || existing.agentName
      saveAgents(agents)
      return NextResponse.json({
        registered: true,
        updated: true,
        agentWallet: existing.agentWallet,
        humanWallet: existing.humanWallet,
        message: 'Agent registration updated. Tell your human to connect their wallet at the AgentGuard dashboard.'
      })
    }

    // New registration
    const registration: AgentRegistration = {
      agentWallet: agentWallet.toLowerCase(),
      humanWallet: humanWallet.toLowerCase(),
      agentName: agentName || 'Unknown Agent',
      platform: platform || 'unknown',
      registeredAt: new Date().toISOString()
    }

    agents.push(registration)
    saveAgents(agents)

    return NextResponse.json({
      registered: true,
      agentWallet: registration.agentWallet,
      humanWallet: registration.humanWallet,
      message: 'Agent registered. Tell your human to connect their wallet at the AgentGuard dashboard to create a vault.'
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Get agents for a human wallet
export async function GET(req: NextRequest) {
  const humanWallet = req.nextUrl.searchParams.get('humanWallet')
  const agentWallet = req.nextUrl.searchParams.get('agentWallet')

  const agents = loadAgents()

  if (humanWallet) {
    const matches = agents.filter(
      a => a.humanWallet.toLowerCase() === humanWallet.toLowerCase()
    )
    return NextResponse.json({ agents: matches })
  }

  if (agentWallet) {
    const match = agents.find(
      a => a.agentWallet.toLowerCase() === agentWallet.toLowerCase()
    )
    return NextResponse.json({ agent: match || null })
  }

  return NextResponse.json({ error: 'Provide humanWallet or agentWallet query param' }, { status: 400 })
}
