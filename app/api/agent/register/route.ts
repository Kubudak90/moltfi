import { NextRequest, NextResponse } from 'next/server'
import { loadAgents, saveAgents, generateApiKey, getAgentWallet } from '../../../../lib/agents'
import type { AgentRegistration } from '../../../../lib/agents'

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
        agentWallet: existing.agentWallet || getAgentWallet(),
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
      if (createData.vault) {
        vault = createData.vault
      }
    } catch {}

    const registration: AgentRegistration = {
      apiKey,
      humanWallet: humanWallet.toLowerCase(),
      agentWallet: getAgentWallet(),
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
      agentWallet: getAgentWallet(),
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
    return NextResponse.json({ agents: [] })
  }

  return NextResponse.json({
    agents: [{
      agentWallet: match.agentWallet || getAgentWallet(),
      agentName: match.agentName,
      humanWallet: match.humanWallet,
      vault: match.vault,
      platform: match.platform,
    }],
  })
}
