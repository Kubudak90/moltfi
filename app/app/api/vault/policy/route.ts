import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, encodeFunctionData } from 'viem'
import { queueTransaction } from '../../../../lib/tx-queue'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const AGENT_POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

const policyAbi = [
  {
    name: 'setPolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'maxPerAction', type: 'uint256' },
      { name: 'dailyLimit', type: 'uint256' },
    ],
    outputs: [],
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

    const maxAction = parseEther(maxPerAction?.toString() || '0.5')
    const daily = parseEther(dailyLimit?.toString() || '1')

    const { hash, receipt } = await queueTransaction(async () => {
      // setPolicy(agent, maxPerAction, dailyLimit) — agent is the server key itself
      // @ts-expect-error viem v2 strict types
      const h = await walletClient.sendTransaction({
        to: AGENT_POLICY,
        data: encodeFunctionData({
          abi: policyAbi,
          functionName: 'setPolicy',
          args: [account.address, maxAction, daily],
        }),
      })
      const r = await publicClient.waitForTransactionReceipt({ hash: h })
      return { hash: h, receipt: r }
    })

    return NextResponse.json({
      success: receipt.status === 'success',
      txHash: hash,
      maxPerAction: maxPerAction?.toString(),
      dailyLimit: dailyLimit?.toString(),
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
