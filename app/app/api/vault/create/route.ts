import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, encodeFunctionData, decodeEventLog } from 'viem'
import { queueTransaction } from '../../../../lib/tx-queue'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const WETH = '0x4200000000000000000000000000000000000006' as const
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const

const factoryAbi = [
  {
    name: 'createVault', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'maxPerAction', type: 'uint256' },
      { name: 'dailyLimit', type: 'uint256' },
      { name: 'tokens', type: 'address[]' },
    ],
    outputs: [{ name: 'vault', type: 'address' }],
  },
  {
    name: 'getVaults', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
] as const

const vaultCreatedEvent = {
  type: 'event' as const,
  name: 'VaultCreated',
  inputs: [
    { name: 'vault', type: 'address', indexed: true },
    { name: 'owner', type: 'address', indexed: true },
    { name: 'agent', type: 'address', indexed: false },
  ],
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { maxPerTrade, dailyLimit } = body

    const pk = process.env.AGENT_PRIVATE_KEY
    if (!pk) {
      return NextResponse.json({ error: 'Server not configured for signing' }, { status: 500 })
    }

    const account = privateKeyToAccount(pk as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() })
    const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })

    // Check if vault already exists
    // @ts-expect-error viem v2 strict types
    const existing = await publicClient.readContract({
      address: VAULT_FACTORY,
      abi: factoryAbi,
      functionName: 'getVaults',
      args: [account.address],
    })

    if (existing && existing.length > 0) {
      return NextResponse.json({
        exists: true,
        vault: existing[0],
        message: 'Vault already exists.',
        explorer: `https://sepolia.basescan.org/address/${existing[0]}`,
      })
    }

    // Create vault — agent is also the caller here (agent creates its own vault)
    // Default limits: 1 ETH max per trade, 5 ETH daily
    const maxAction = parseEther(maxPerTrade?.toString() || '1')
    const daily = parseEther(dailyLimit?.toString() || '5')

    const { hash, receipt } = await queueTransaction(async () => {
      // @ts-expect-error viem v2 strict types
      const h = await walletClient.sendTransaction({
        to: VAULT_FACTORY,
        data: encodeFunctionData({
          abi: factoryAbi,
          functionName: 'createVault',
          args: [account.address, maxAction, daily, [WETH, USDC]],
        }),
      })
      const r = await publicClient.waitForTransactionReceipt({ hash: h })
      return { hash: h, receipt: r }
    })

    // Get vault address from logs
    let vaultAddress: string | null = null
    for (const log of receipt.logs) {
      try {
        // @ts-expect-error viem v2 strict types
        const decoded = decodeEventLog({ abi: [vaultCreatedEvent], data: log.data, topics: log.topics })
        // @ts-expect-error viem v2 strict types
        if (decoded.eventName === 'VaultCreated') {
          // @ts-expect-error viem v2 strict types
          vaultAddress = (decoded.args as any).vault
          break
        }
      } catch {}
    }

    // Fallback: read from factory
    if (!vaultAddress) {
      // @ts-expect-error viem v2 strict types
      const vaults = await publicClient.readContract({
        address: VAULT_FACTORY,
        abi: factoryAbi,
        functionName: 'getVaults',
        args: [account.address],
      })
      vaultAddress = vaults[vaults.length - 1] as string
    }

    return NextResponse.json({
      success: true,
      vault: vaultAddress,
      txHash: hash,
      maxPerTrade: maxPerTrade?.toString() || '1',
      dailyLimit: dailyLimit?.toString() || '5',
      approvedTokens: ['WETH', 'USDC'],
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
      message: 'Vault created! You can now deposit ETH with POST /api/vault/deposit.',
    }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
