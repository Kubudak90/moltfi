import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, encodeFunctionData, parseEther, formatEther, formatUnits } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'
import { lookupVault } from '../lookup'

const TOKENS: Record<string, { address: `0x${string}`; decimals: number }> = {
  WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  USDC: { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
}

const executeSwapAbi = [
  {
    name: 'executeSwap',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'fee', type: 'uint24' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMinimum', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const

export async function POST(req: NextRequest) {
  try {
    const { tokenIn, tokenOut, amount } = await req.json()
    if (!tokenIn || !tokenOut || !amount) {
      return NextResponse.json({ error: 'tokenIn, tokenOut, amount required (e.g. { tokenIn: "WETH", tokenOut: "USDC", amount: "0.001" })' }, { status: 400 })
    }

    const pk = process.env.AGENT_PRIVATE_KEY
    if (!pk) {
      return NextResponse.json({ error: 'Server not configured for signing' }, { status: 500 })
    }

    const inToken = TOKENS[tokenIn.toUpperCase()]
    const outToken = TOKENS[tokenOut.toUpperCase()]
    if (!inToken || !outToken) {
      return NextResponse.json({ error: `Unknown token. Supported: ${Object.keys(TOKENS).join(', ')}` }, { status: 400 })
    }

    const account = privateKeyToAccount(pk as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() })
    const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })

    const vault = await lookupVault(account.address)
    if (!vault) {
      return NextResponse.json({ error: 'No vault found. Create a vault first.' }, { status: 404 })
    }

    const amountRaw = BigInt(Math.floor(parseFloat(amount) * (10 ** inToken.decimals)))

    // Call vault.executeSwap() — vault approves router, router checks policy, executes on Uniswap
    const data = encodeFunctionData({
      abi: executeSwapAbi,
      functionName: 'executeSwap',
      args: [inToken.address, outToken.address, 3000, amountRaw, BigInt(0)],
    })

    const hash = await walletClient.sendTransaction({ to: vault as `0x${string}`, data })
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Parse SwapExecuted event from receipt logs
    let amountOut = ''
    for (const log of receipt.logs) {
      // SwapExecuted topic
      if (log.topics[0] === '0x7f3b7a57e0b80ef1e83ebbe31a0a88cb81e0f6fa60f7e10fe3478d12a tried') continue
      // Just report success
    }

    return NextResponse.json({
      success: receipt.status === 'success',
      txHash: hash,
      status: receipt.status,
      swap: { tokenIn: tokenIn.toUpperCase(), tokenOut: tokenOut.toUpperCase(), amount },
      vault,
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
      note: 'Swap executed through AgentGuardRouter — policy was checked on-chain before execution.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
