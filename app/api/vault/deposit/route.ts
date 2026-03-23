import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, encodeFunctionData } from 'viem'
import { queueTransaction } from '../../../../lib/tx-queue'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { lookupVault } from '../lookup'

const RPC_URL = 'https://sepolia.base.org'
const vaultAbi = [
  { name: 'depositETH', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] },
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
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http(RPC_URL) })
    const publicClient = createPublicClient({ chain: baseSepolia, transport: http(RPC_URL) })

    const vault = await lookupVault(account.address)
    if (!vault) {
      return NextResponse.json({
        error: 'No vault found. Create a vault first — your human can do it from the dashboard, or call POST /api/vault/create.',
      }, { status: 404 })
    }

    const value = parseEther(amount.toString())

    const { hash, receipt } = await queueTransaction(async () => {
      const nonce = await publicClient.getTransactionCount({
        address: account.address,
        blockTag: 'pending',
      })

      // Single-tx native vault deposit: vault.depositETH()
      // @ts-expect-error viem v2 strict types
      const h = await walletClient.sendTransaction({
        to: vault as `0x${string}`,
        value,
        nonce,
        data: encodeFunctionData({ abi: vaultAbi, functionName: 'depositETH' }),
      })
      const r = await publicClient.waitForTransactionReceipt({ hash: h })
      return { hash: h, receipt: r }
    })

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
