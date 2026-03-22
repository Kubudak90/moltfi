import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, encodeFunctionData, parseEther } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const VAULT = '0x333896c4c1b58c5c9b56967301c008C073Bd2279' as const

const vaultAbi = [
  {
    name: 'stakeETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
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

    const amountRaw = parseEther(amount.toString())

    const data = encodeFunctionData({
      abi: vaultAbi,
      functionName: 'stakeETH',
      args: [amountRaw],
    })

    const hash = await walletClient.sendTransaction({ to: VAULT, data } as any)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return NextResponse.json({
      success: receipt.status === 'success',
      txHash: hash,
      status: receipt.status,
      amount: `${amount} ETH staked via Lido`,
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
      note: 'ETH staked into Lido via vault. ETH → stETH → wstETH. Principal tracked — only yield above principal can be traded.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
