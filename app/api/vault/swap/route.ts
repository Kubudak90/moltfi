import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, encodeFunctionData, formatEther, formatUnits } from 'viem'
import { queueTransaction } from '../../../../lib/tx-queue'
import { privateKeyToAccount } from 'viem/accounts'
import { base, baseSepolia } from 'viem/chains'
import { lookupVault } from '../lookup'

const SEPOLIA_TOKENS: Record<string, { address: `0x${string}`; decimals: number }> = {
  WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  USDC: { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6 },
}

const MAINNET_TOKENS: Record<string, { address: `0x${string}`; decimals: number }> = {
  WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18 },
  USDC: { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6 },
  WSTETH: { address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452', decimals: 18 },
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
    const { tokenIn, tokenOut, amount, chain: chainParam } = await req.json()
    if (!tokenIn || !tokenOut || !amount) {
      return NextResponse.json({ error: 'tokenIn, tokenOut, amount required' }, { status: 400 })
    }

    const pk = process.env.AGENT_PRIVATE_KEY
    if (!pk) {
      return NextResponse.json({ error: 'Server not configured for signing' }, { status: 500 })
    }

    const isMainnet = chainParam === 'mainnet'
    const TOKENS = isMainnet ? MAINNET_TOKENS : SEPOLIA_TOKENS
    const chain = isMainnet ? base : baseSepolia
    const rpcUrl = isMainnet ? 'https://mainnet.base.org' : 'https://sepolia.base.org'
    const explorer = isMainnet ? 'https://basescan.org' : 'https://sepolia.basescan.org'

    const inKey = tokenIn.toUpperCase() === 'WSTETH' ? 'WSTETH' : tokenIn.toUpperCase()
    const outKey = tokenOut.toUpperCase() === 'WSTETH' ? 'WSTETH' : tokenOut.toUpperCase()
    const inToken = TOKENS[inKey]
    const outToken = TOKENS[outKey]
    if (!inToken || !outToken) {
      return NextResponse.json({ error: `Unknown token. Supported on ${isMainnet ? 'mainnet' : 'sepolia'}: ${Object.keys(TOKENS).join(', ')}` }, { status: 400 })
    }

    const account = privateKeyToAccount(pk as `0x${string}`)
    const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) })
    const publicClient = createPublicClient({ chain, transport: http(rpcUrl) })

    const vault = await lookupVault(account.address)
    if (!vault) {
      return NextResponse.json({ error: 'No vault found. Create a vault first.' }, { status: 404 })
    }

    const amountRaw = BigInt(Math.floor(parseFloat(amount) * (10 ** inToken.decimals)))

    // Use 3000 (0.3%) fee for WETH↔USDC, 100 (0.01%) for WETH↔wstETH (correlated pair)
    const fee = (inKey === 'WSTETH' || outKey === 'WSTETH') ? 100 : 3000

    const data = encodeFunctionData({
      abi: executeSwapAbi,
      functionName: 'executeSwap',
      args: [inToken.address, outToken.address, fee, amountRaw, BigInt(0)],
    })

    const { hash, receipt } = await queueTransaction(async () => {
      // @ts-expect-error viem v2 strict types
      const h = await walletClient.sendTransaction({ to: vault as `0x${string}`, data })
      const r = await publicClient.waitForTransactionReceipt({ hash: h })
      return { hash: h, receipt: r }
    })

    return NextResponse.json({
      success: receipt.status === 'success',
      txHash: hash,
      status: receipt.status,
      swap: { tokenIn: inKey, tokenOut: outKey, amount },
      vault,
      chain: isMainnet ? 'base' : 'base-sepolia',
      explorer: `${explorer}/tx/${hash}`,
      note: 'Swap executed through AgentGuardRouter — policy checked on-chain before execution.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
