import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const

const factoryAbi = [{
  name: 'revokePolicy', type: 'function', stateMutability: 'nonpayable',
  inputs: [{ name: 'vault', type: 'address' }],
  outputs: [],
}] as const

export async function POST(req: NextRequest) {
  try {
    const { vault } = await req.json()
    if (!vault) return NextResponse.json({ error: 'vault address required' }, { status: 400 })

    const pk = process.env.AGENT_PRIVATE_KEY
    if (!pk) return NextResponse.json({ error: 'Server signing key not configured' }, { status: 500 })

    const account = privateKeyToAccount(pk as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http('https://sepolia.base.org') })
    const publicClient = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })

    const data = encodeFunctionData({
      abi: factoryAbi,
      functionName: 'revokePolicy',
      args: [vault as `0x${string}`],
    })

    // @ts-expect-error viem v2 strict types
    const txHash = await walletClient.sendTransaction({ to: VAULT_FACTORY, data })
    await publicClient.waitForTransactionReceipt({ hash: txHash })

    return NextResponse.json({
      success: true,
      frozen: true,
      txHash,
      explorer: `https://sepolia.basescan.org/tx/${txHash}`,
      message: 'All agent trading has been frozen. The policy is now inactive — no trades will execute.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
