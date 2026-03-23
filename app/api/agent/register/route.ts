import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { loadAgents, saveAgents, generateApiKey, getAgentWallet } from '../../../../lib/agents'
import type { AgentRegistration } from '../../../../lib/agents'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const factoryAbi = [{
  name: 'getVaults', type: 'function', stateMutability: 'view',
  inputs: [{ name: 'user', type: 'address' }],
  outputs: [{ name: '', type: 'address[]' }],
}] as const

async function findVaultForOwner(owner: string): Promise<string | null> {
  try {
    const client = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    })
    // @ts-expect-error viem strict types
    const vaults = await client.readContract({
      address: VAULT_FACTORY, abi: factoryAbi,
      functionName: 'getVaults', args: [owner as `0x${string}`],
    })
    return vaults.length > 0 ? (vaults[0] as string) : null
  } catch (e) {
    console.error('[register] findVaultForOwner error:', e)
    return null
  }
}

async function findSignerVault(): Promise<string | null> {
  const agentWallet = getAgentWallet()
  if (!agentWallet) return null
  return findVaultForOwner(agentWallet)
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
      // Prefer the human's real vault; fall back to signer vault only if needed
      const humanVault = await findVaultForOwner(humanWallet)
      if (humanVault) {
        existing.vault = humanVault
      } else if (!existing.vault) {
        const onChainVault = await findSignerVault()
        if (onChainVault) existing.vault = onChainVault
      }
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

    // New registration — generate API key
    const apiKey = generateApiKey()

    // Prefer a vault owned by the human wallet; fall back to signer vault, then create one
    let vault = ''
    const humanVault = await findVaultForOwner(humanWallet)
    if (humanVault) {
      vault = humanVault
    } else {
      const existingVault = await findSignerVault()
      if (existingVault) {
        vault = existingVault
      } else {
      try {
        const proto = req.headers.get('x-forwarded-proto') || 'https'
        const host = req.headers.get('host') || req.nextUrl.host
        const origin = `${proto}://${host}`
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
      }
    }

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
