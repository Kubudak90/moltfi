import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const factoryAbi = [
  { name: 'getVaults', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'address[]' }] },
] as const

const client = createPublicClient({ chain: baseSepolia, transport: http() })

/**
 * Look up the vault for the given agent address.
 * Checks agent registration → human wallet → factory getVaults.
 */
export async function lookupVault(agentAddress: string): Promise<string | null> {
  const dbPath = join(process.cwd(), 'data', 'agents.json')

  // 1. Find human wallet from agent registration
  if (existsSync(dbPath)) {
    try {
      const agents = JSON.parse(readFileSync(dbPath, 'utf-8'))
      const agent = agents.find((a: any) => a.agentWallet.toLowerCase() === agentAddress.toLowerCase())
      if (agent) {
        // @ts-expect-error viem v2 strict types
        const vaults = await client.readContract({
          address: VAULT_FACTORY,
          abi: factoryAbi,
          functionName: 'getVaults',
          args: [agent.humanWallet as `0x${string}`],
        })
        if (vaults && vaults.length > 0) return vaults[0] as string
      }
    } catch {}
  }

  // 2. Fallback: check if agent itself owns vaults
  try {
    // @ts-expect-error viem v2 strict types
    const vaults = await client.readContract({
      address: VAULT_FACTORY,
      abi: factoryAbi,
      functionName: 'getVaults',
      args: [agentAddress as `0x${string}`],
    })
    if (vaults && vaults.length > 0) return vaults[0] as string
  } catch {}

  return null
}
