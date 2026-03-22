import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, encodeFunctionData } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { baseSepolia } from 'viem/chains'

const ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as const

const TOKENS: Record<string, `0x${string}`> = {
  WETH: '0x4200000000000000000000000000000000000006',
  USDC: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
}

const routerAbi = [
  {
    name: 'swapExactInput',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'fee', type: 'uint24' },
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

    const inAddr = TOKENS[tokenIn.toUpperCase()]
    const outAddr = TOKENS[tokenOut.toUpperCase()]
    if (!inAddr || !outAddr) {
      return NextResponse.json({ error: `Unknown token. Supported: ${Object.keys(TOKENS).join(', ')}` }, { status: 400 })
    }

    const account = privateKeyToAccount(pk as `0x${string}`)
    const walletClient = createWalletClient({ account, chain: baseSepolia, transport: http() })
    const publicClient = createPublicClient({ chain: baseSepolia, transport: http() })

    const amountRaw = BigInt(Math.floor(parseFloat(amount) * 1e18))

    // Get quote from Uniswap Trading API
    let quote = null
    try {
      const apiKey = process.env.UNISWAP_API_KEY
      if (apiKey) {
        const quoteRes = await fetch('https://trade-api.gateway.uniswap.org/v1/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'x-universal-router-version': '2.0' },
          body: JSON.stringify({
            type: 'EXACT_INPUT', amount: amountRaw.toString(),
            tokenInChainId: 84532, tokenOutChainId: 84532,
            tokenIn: inAddr, tokenOut: outAddr, swapper: account.address,
            autoSlippage: 'DEFAULT', routingPreference: 'BEST_PRICE',
          }),
        })
        quote = await quoteRes.json()
      }
    } catch {}

    // Execute swap through AgentGuardRouter (policy enforced on-chain)
    const data = encodeFunctionData({
      abi: routerAbi,
      functionName: 'swapExactInput',
      args: [inAddr, outAddr, amountRaw, BigInt(0), 3000],
    })

    const hash = await walletClient.sendTransaction({ to: ROUTER, data } as any)
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return NextResponse.json({
      success: receipt.status === 'success',
      txHash: hash,
      status: receipt.status,
      swap: { tokenIn, tokenOut, amount },
      quote: quote ? { estimatedOutput: quote.quote?.quoteDecimals } : null,
      explorer: `https://sepolia.basescan.org/tx/${hash}`,
      note: 'Swap executed through AgentGuardRouter — policy was checked before execution.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
