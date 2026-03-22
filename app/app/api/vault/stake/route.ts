import { NextRequest, NextResponse } from 'next/server'
import { encodeFunctionData } from 'viem'

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
    const { agentWallet, vault, amount } = await req.json()
    if (!agentWallet || !vault || !amount) {
      return NextResponse.json({ error: 'agentWallet, vault, amount required' }, { status: 400 })
    }

    const amountRaw = BigInt(Math.floor(parseFloat(amount) * 1e18))

    const data = encodeFunctionData({
      abi: vaultAbi,
      functionName: 'stakeETH',
      args: [amountRaw],
    })

    return NextResponse.json({
      transaction: {
        to: vault,
        data,
        chainId: 84532,
        from: agentWallet,
      },
      note: 'Stakes ETH into Lido via the vault. ETH → stETH → wstETH. Principal is tracked — only yield above principal can be traded.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
