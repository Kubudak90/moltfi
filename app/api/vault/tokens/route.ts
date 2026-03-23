import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const

const approveAbi = [{
  name: 'approveToken', type: 'function', stateMutability: 'nonpayable',
  inputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }],
  outputs: [],
}] as const

const removeAbi = [{
  name: 'removeToken', type: 'function', stateMutability: 'nonpayable',
  inputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }],
  outputs: [],
}] as const

const KNOWN_TOKENS: Record<string, string> = {
  'WETH': '0x4200000000000000000000000000000000000006',
  'USDC': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
}

export async function POST(req: NextRequest) {
  try {
    const { vault, token, action } = await req.json()
    if (!vault) return NextResponse.json({ error: 'vault address required' }, { status: 400 })
    if (!token) return NextResponse.json({ error: 'token address or symbol required' }, { status: 400 })
    if (!action || !['approve', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "remove"' }, { status: 400 })
    }

    const tokenAddress = KNOWN_TOKENS[token.toUpperCase()] || token
    if (!tokenAddress.startsWith('0x')) {
      return NextResponse.json({ error: `Unknown token: ${token}` }, { status: 400 })
    }

    const pk = process.env.AGENT_PRIVATE_KEY
    if (!pk) return NextResponse.json({ error: 'Server signing key not configured' }, { status: 500 })

    const account = privateKeyToAccount(pk as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http('https://sepolia.base.org') })
    const publicClient = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })

    const abi = action === 'approve' ? approveAbi : removeAbi
    const fn = action === 'approve' ? 'approveToken' : 'removeToken'

    const txHash = await walletClient.writeContract({
      address: VAULT_FACTORY,
      abi,
      functionName: fn,
      args: [vault as `0x${string}`, tokenAddress as `0x${string}`],
    })

    await publicClient.waitForTransactionReceipt({ hash: txHash })

    return NextResponse.json({
      success: true,
      action,
      token: tokenAddress,
      txHash,
      explorer: `https://sepolia.basescan.org/tx/${txHash}`,
      message: action === 'approve'
        ? `Token ${token} approved for trading.`
        : `Token ${token} removed from allowlist.`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
