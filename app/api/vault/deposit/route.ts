import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, encodeFunctionData } from 'viem'
import { queueTransaction } from '../../../../lib/tx-queue'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const RPC_URL = 'https://sepolia.base.org'
import { lookupVault } from '../lookup'

const WETH = '0x4200000000000000000000000000000000000006' as const
const wethAbi = [
  { name: 'deposit', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] },
  { name: 'transfer', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
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

    const { transferHash, receipt } = await queueTransaction(async () => {
      const wrapNonce = await publicClient.getTransactionCount({
        address: account.address,
        blockTag: 'pending',
      })

      // Wrap ETH → WETH
      // @ts-expect-error viem v2 strict types
      const wrapHash = await walletClient.sendTransaction({
        to: WETH,
        value,
        nonce: wrapNonce,
        data: encodeFunctionData({ abi: wethAbi, functionName: 'deposit' }),
      })
      await publicClient.waitForTransactionReceipt({ hash: wrapHash })

      const transferNonce = await publicClient.getTransactionCount({
        address: account.address,
        blockTag: 'pending',
      })

      // Transfer WETH to vault after re-reading nonce from chain
      // @ts-expect-error viem v2 strict types
      const tHash = await walletClient.sendTransaction({
        to: WETH,
        nonce: transferNonce,
        data: encodeFunctionData({
          abi: wethAbi,
          functionName: 'transfer',
          args: [vault as `0x${string}`, value],
        }),
      })
      const r = await publicClient.waitForTransactionReceipt({ hash: tHash })
      return { transferHash: tHash, receipt: r }
    })

    return NextResponse.json({
      success: true,
      txHash: transferHash,
      status: receipt.status,
      amount: `${amount} ETH`,
      vault,
      explorer: `https://sepolia.basescan.org/tx/${transferHash}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
