import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, encodeFunctionData } from 'viem'
import { baseSepolia } from 'viem/chains'

const ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as const

const TOKENS: Record<string, string> = {
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
    const { agentWallet, tokenIn, tokenOut, amount } = await req.json()
    if (!agentWallet || !tokenIn || !tokenOut || !amount) {
      return NextResponse.json({ error: 'agentWallet, tokenIn, tokenOut, amount required' }, { status: 400 })
    }

    const inAddr = TOKENS[tokenIn.toUpperCase()]
    const outAddr = TOKENS[tokenOut.toUpperCase()]
    if (!inAddr || !outAddr) {
      return NextResponse.json({ error: `Unknown token. Supported: ${Object.keys(TOKENS).join(', ')}` }, { status: 400 })
    }

    const amountRaw = BigInt(Math.floor(parseFloat(amount) * 1e18))

    // First get a quote from Uniswap Trading API
    let quoteResult = null
    try {
      const apiKey = process.env.UNISWAP_API_KEY
      if (apiKey) {
        const quoteRes = await fetch('https://trade-api.gateway.uniswap.org/v1/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'x-universal-router-version': '2.0' },
          body: JSON.stringify({
            type: 'EXACT_INPUT', amount: amountRaw.toString(),
            tokenInChainId: '84532', tokenOutChainId: '84532',
            tokenIn: inAddr, tokenOut: outAddr, swapper: agentWallet,
            autoSlippage: 'DEFAULT', routingPreference: 'BEST_PRICE',
          }),
        })
        quoteResult = await quoteRes.json()
      }
    } catch {}

    // Build the swap transaction via our AgentGuardRouter (which enforces policy)
    const data = encodeFunctionData({
      abi: routerAbi,
      functionName: 'swapExactInput',
      args: [inAddr as `0x${string}`, outAddr as `0x${string}`, amountRaw, BigInt(0), 3000],
    })

    return NextResponse.json({
      transaction: {
        to: ROUTER,
        data,
        chainId: 84532,
        from: agentWallet,
      },
      quote: quoteResult,
      note: 'This swap goes through AgentGuardRouter which checks your policy before executing. Sign and broadcast to execute.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
