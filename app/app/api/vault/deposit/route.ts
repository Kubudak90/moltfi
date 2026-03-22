import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const factoryAbi = [
  { name: 'getVaults', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'address[]' }] },
] as const

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json()
    if (!amount) {
      return NextResponse.json({ error: 'amount required (in ETH, e.g. "0.01")' }, { status: 400 })
    }

    const pk = process.env.AGENT_PRIVATE_KEY
    if (!pk) {
      return NextResponse.json({ error: 'Server not configured for signing' }, { status: 500 })
    }

    const account = privateKeyToAccount(pk as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() })
    const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })

    // Look up vault — check agent registration to find human wallet, then query factory
    const { readFileSync, existsSync } = require('fs')
    const { join } = require('path')
    const dbPath = join(process.cwd(), 'data', 'agents.json')
    let vault: string | null = null

    if (existsSync(dbPath)) {
      const agents = JSON.parse(readFileSync(dbPath, 'utf-8'))
      const agent = agents.find((a: any) => a.agentWallet.toLowerCase() === account.address.toLowerCase())
      if (agent) {
        const vaults = await publicClient.readContract({
          address: VAULT_FACTORY,
          abi: factoryAbi,
          functionName: 'getVaults',
          args: [agent.humanWallet as `0x${string}`],
        })
        if (vaults && vaults.length > 0) vault = vaults[0] as string
      }
    }

    // Fallback: check if agent itself owns vaults
    if (!vault) {
      const vaults = await publicClient.readContract({
        address: VAULT_FACTORY,
        abi: factoryAbi,
        functionName: 'getVaults',
        args: [account.address],
      })
      if (vaults && vaults.length > 0) vault = vaults[0] as string
    }

    if (!vault) {
      return NextResponse.json({
        error: 'No vault found. Create a vault first — your human can do it from the dashboard, or call POST /api/vault/create.',
      }, { status: 404 })
    }
    const value = parseEther(amount.toString())

    // Send ETH directly — vault has receive() so it accepts plain transfers
    // depositETH() is owner-only, but agents can still fund the vault
    const hash = await walletClient.sendTransaction({
      to: vault as `0x${string}`,
      value,
    })

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return NextResponse.json({
      success: true,
      txHash: hash,
      status: receipt.status,
      amount: `${amount} ETH`,
      vault,
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
