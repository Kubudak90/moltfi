import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'
import { privateKeyToAccount } from 'viem/accounts'

const DB_PATH = join(process.cwd(), 'data', 'agents.json')

export interface AgentRegistration {
  apiKey: string
  humanWallet: string
  agentWallet: string
  vault: string
  agentName: string
  platform: string
  registeredAt: string
}

export function loadAgents(): AgentRegistration[] {
  try {
    if (existsSync(DB_PATH)) {
      return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
    }
  } catch {}
  return []
}

export function saveAgents(agents: AgentRegistration[]) {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(DB_PATH, JSON.stringify(agents, null, 2))
}

export function generateApiKey(): string {
  return 'mf_' + randomBytes(24).toString('hex')
}

export function getAgentWallet(): string {
  const pk = process.env.AGENT_PRIVATE_KEY
  if (!pk) return ''
  return privateKeyToAccount(pk as `0x${string}`).address
}

export function lookupByApiKey(apiKey: string): AgentRegistration | null {
  const agents = loadAgents()
  return agents.find(a => a.apiKey === apiKey) || null
}

export function updateVault(apiKey: string, vault: string) {
  const agents = loadAgents()
  const agent = agents.find(a => a.apiKey === apiKey)
  if (agent) {
    agent.vault = vault
    saveAgents(agents)
  }
}
