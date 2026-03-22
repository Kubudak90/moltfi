import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, formatEther, encodeFunctionData } from 'viem'
import { queueTransaction } from '../../../../lib/tx-queue'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { lookupVault } from '../lookup'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const AGENT_POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

const factoryAbi = [
  {
    name: 'updatePolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'vault', type: 'address' },
      { name: 'maxPerAction', type: 'uint256' },
      { name: 'dailyLimit', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

const policyReadAbi = [
  {
    name: 'policies', type: 'function', stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }],
    outputs: [{ name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }, { name: 'active', type: 'bool' }],
  },
  {
    name: 'getDailySpent', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getRemainingAllowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { maxPerAction, dailyLimit } = body

    if (!maxPerAction && !dailyLimit) {
      return NextResponse.json({ error: 'Provide maxPerAction and/or dailyLimit (in ETH)' }, { status: 400 })
    }

    const pk = process.env.AGENT_PRIVATE_KEY
    if (!pk) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const account = privateKeyToAccount(pk as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() })
    const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })

    // Find the vault for this server key
    const vault = await lookupVault(account.address)
    if (!vault) {
      return NextResponse.json({ error: 'No vault found. Create a vault first.' }, { status: 404 })
    }

    const maxAction = parseEther(maxPerAction?.toString() || '0.5')
    const daily = parseEther(dailyLimit?.toString() || '1')

    // Update policy through the factory (which owns the policy mapping for this vault)
    const { hash, receipt } = await queueTransaction(async () => {
      // @ts-expect-error viem v2 strict types
      const h = await walletClient.sendTransaction({
        to: VAULT_FACTORY,
        data: encodeFunctionData({
          abi: factoryAbi,
          functionName: 'updatePolicy',
          args: [vault as `0x${string}`, maxAction, daily],
        }),
      })
      const r = await publicClient.waitForTransactionReceipt({ hash: h })
      return { hash: h, receipt: r }
    })

    return NextResponse.json({
      success: receipt.status === 'success',
      txHash: hash,
      vault,
      maxPerAction: maxPerAction?.toString(),
      dailyLimit: dailyLimit?.toString(),
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET — read current policy for the server's vault
export async function GET() {
  try {
    const pk = process.env.AGENT_PRIVATE_KEY
    if (!pk) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

    const account = privateKeyToAccount(pk as `0x${string}`)
    const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })

    const vault = await lookupVault(account.address)
    if (!vault) return NextResponse.json({ error: 'No vault' }, { status: 404 })

    const [policy, dailySpent, remaining] = await Promise.all([
      publicClient.readContract({ address: AGENT_POLICY, abi: policyReadAbi, functionName: 'policies', args: [VAULT_FACTORY, vault as `0x${string}`] } as any),
      publicClient.readContract({ address: AGENT_POLICY, abi: policyReadAbi, functionName: 'getDailySpent', args: [vault as `0x${string}`] } as any),
      publicClient.readContract({ address: AGENT_POLICY, abi: policyReadAbi, functionName: 'getRemainingAllowance', args: [vault as `0x${string}`] } as any),
    ])

    return NextResponse.json({
      vault,
      policy: {
        maxPerAction: formatEther((policy as any)[0]),
        dailyLimit: formatEther((policy as any)[1]),
        active: (policy as any)[2],
      },
      dailySpent: formatEther(dailySpent as bigint),
      remaining: formatEther(remaining as bigint),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
