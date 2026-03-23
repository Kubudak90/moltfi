import { createPublicClient, http } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const SEPOLIA_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const MAINNET_FACTORY = '0x5AFC9Ff3230eE0E4bE9e110F7672584Ab593A4F6' as const
const factoryAbi = [
  { name: 'getVaults', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'address[]' }] },
] as const

const sepoliaClient = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })
const mainnetClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') })

/**
 * Look up the vault for the given agent address.
 * @param chain - 'mainnet' or 'sepolia' (default)
 */
export async function lookupVault(agentAddress: string, chain?: string): Promise<string | null> {
  const isMainnet = chain === 'mainnet'
  const client = isMainnet ? mainnetClient : sepoliaClient
  const factory = isMainnet ? MAINNET_FACTORY : SEPOLIA_FACTORY

  // 1. Check on-chain vaults owned by the agent
  try {
    const vaults = await (client as any).readContract({
      address: factory,
      abi: factoryAbi,
      functionName: 'getVaults',
      args: [agentAddress as `0x${string}`],
    })
    if (vaults && vaults.length > 0) return vaults[vaults.length - 1] as string
  } catch {}

  // 2. Check vaults owned by registered humans (agent may be authorized on their vault)
  const dbPath = join(process.cwd(), 'data', 'agents.json')
  if (existsSync(dbPath)) {
    try {
      const agents = JSON.parse(readFileSync(dbPath, 'utf-8'))
      for (const a of agents) {
        if (!a.humanWallet) continue
        try {
          const vaults = await (client as any).readContract({
            address: factory,
            abi: factoryAbi,
            functionName: 'getVaults',
            args: [a.humanWallet as `0x${string}`],
          })
          if (vaults && vaults.length > 0) return vaults[vaults.length - 1] as string
        } catch {}
      }
    } catch {}
  }

  // 3. Fallback: check agent registration for linked vault
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
