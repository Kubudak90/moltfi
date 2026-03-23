import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const factoryAbi = [
  { name: 'getVaults', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'address[]' }] },
] as const

const client = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })

/**
 * Look up the vault for the given agent address.
 * Priority: on-chain vaults owned by the agent → agent registration → human wallet vaults.
 */
export async function lookupVault(agentAddress: string): Promise<string | null> {
  // 1. Check if agent itself owns vaults on-chain (most reliable — signer IS the owner+agent)
  try {
    // @ts-expect-error viem v2 strict types
    const vaults = await client.readContract({
      address: VAULT_FACTORY,
      abi: factoryAbi,
      functionName: 'getVaults',
      args: [agentAddress as `0x${string}`],
    })
    if (vaults && vaults.length > 0) return vaults[vaults.length - 1] as string
  } catch {}

  // 2. Fallback: check agent registration for linked vault
  const dbPath = join(process.cwd(), 'data', 'agents.json')
  if (existsSync(dbPath)) {
    try {
      const agents = JSON.parse(readFileSync(dbPath, 'utf-8'))
      const agent = agents.find((a: any) =>
        (a.agentWallet && a.agentWallet.toLowerCase() === agentAddress.toLowerCase()) ||
        a.humanWallet.toLowerCase() === agentAddress.toLowerCase()
      )
      if (agent && agent.vault) return agent.vault
    } catch {}
  }

  return null
}
