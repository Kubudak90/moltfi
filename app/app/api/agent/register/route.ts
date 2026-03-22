import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'

const DB_PATH = join(process.cwd(), 'data', 'agents.json')

interface AgentRegistration {
  apiKey: string
  humanWallet: string
  vault: string
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
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(DB_PATH, JSON.stringify(agents, null, 2))
}

function generateApiKey(): string {
  return 'mf_' + randomBytes(24).toString('hex')
}

// Look up agent by API key — used by /api/agent
export function lookupByApiKey(apiKey: string): AgentRegistration | null {
  const agents = loadAgents()
  return agents.find(a => a.apiKey === apiKey) || null
}

// Update vault address for a registration
export function updateVault(apiKey: string, vault: string) {
  const agents = loadAgents()
  const agent = agents.find(a => a.apiKey === apiKey)
  if (agent) {
    agent.vault = vault
    saveAgents(agents)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { humanWallet, agentName, platform } = await req.json()

    if (!humanWallet) {
      return NextResponse.json(
        { error: 'humanWallet is required (the wallet that owns the vault)' },
        { status: 400 }
      )
    }

    const agents = loadAgents()

    // Check if already registered
    const existing = agents.find(
      a => a.humanWallet.toLowerCase() === humanWallet.toLowerCase()
    )

    if (existing) {
      if (agentName) existing.agentName = agentName
      saveAgents(agents)

      return NextResponse.json({
        registered: true,
        updated: true,
        apiKey: existing.apiKey,
        vault: existing.vault || null,
        message: existing.vault
          ? 'Already registered. Vault is ready — start trading.'
          : 'Already registered. Say "create a vault" to get started.',
      })
    }

    // New registration — generate API key, then create vault
    const apiKey = generateApiKey()

    // Create or find vault on-chain
    let vault = ''
    try {
      const origin = req.nextUrl.origin
      const createRes = await fetch(`${origin}/api/vault/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPerTrade: '0.5', dailyLimit: '1' }),
      })
      const createData = await createRes.json()
      // Works whether vault is new or already exists
      if (createData.vault) {
        vault = createData.vault
      }
    } catch {}

    const registration: AgentRegistration = {
      apiKey,
      humanWallet: humanWallet.toLowerCase(),
      vault,
      agentName: agentName || 'Unknown Agent',
      platform: platform || 'unknown',
      registeredAt: new Date().toISOString(),
    }

    agents.push(registration)
    saveAgents(agents)

    return NextResponse.json({
      registered: true,
      apiKey,
      vault: vault || null,
      message: vault
        ? `Registered and vault created at ${vault}. You can now deposit ETH and start trading. Use your API key for all requests.`
        : 'Registered but vault creation failed. Say "create a vault" to try again.',
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const humanWallet = req.nextUrl.searchParams.get('humanWallet')

  if (!humanWallet) {
    return NextResponse.json({ error: 'Provide humanWallet query param' }, { status: 400 })
  }

  const agents = loadAgents()
  const match = agents.find(
    a => a.humanWallet.toLowerCase() === humanWallet.toLowerCase()
  )

  if (!match) {
    return NextResponse.json({ registered: false })
  }

  return NextResponse.json({
    registered: true,
    vault: match.vault,
    agentName: match.agentName,
  })
}
