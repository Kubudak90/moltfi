import { NextRequest, NextResponse } from 'next/server'

// Uniswap Trading API — quote endpoint
// Docs: https://docs.uniswap.org/api/trading/overview
// API key: get from https://developers.uniswap.org/dashboard/

const UNISWAP_API = 'https://trade-api.gateway.uniswap.org/v1/quote'

// Base Sepolia token addresses
const TOKENS: Record<string, { address: string; decimals: number; chainId: number }> = {
  WETH: { address: '0x4200000000000000000000000000000000000006', decimals: 18, chainId: 84532 },
  USDC: { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', decimals: 6, chainId: 84532 },
  ETH: { address: '0x0000000000000000000000000000000000000000', decimals: 18, chainId: 84532 },
}

export async function POST(req: NextRequest) {
  try {
    const { tokenIn, tokenOut, amount, swapper } = await req.json()

    if (!tokenIn || !tokenOut || !amount || !swapper) {
      return NextResponse.json({ error: 'tokenIn, tokenOut, amount, swapper required' }, { status: 400 })
    }

    const inToken = TOKENS[tokenIn.toUpperCase()]
    const outToken = TOKENS[tokenOut.toUpperCase()]
    if (!inToken || !outToken) {
      return NextResponse.json({ error: `Unknown token. Supported: ${Object.keys(TOKENS).join(', ')}` }, { status: 400 })
    }

    // Convert amount to raw units
    const rawAmount = BigInt(Math.floor(parseFloat(amount) * (10 ** inToken.decimals))).toString()

    const apiKey = process.env.UNISWAP_API_KEY
    if (!apiKey) {
      // Fallback: return a simulated quote structure explaining API key needed
      return NextResponse.json({
        quote: {
          tokenIn: { symbol: tokenIn.toUpperCase(), address: inToken.address, amount },
          tokenOut: { symbol: tokenOut.toUpperCase(), address: outToken.address },
          note: 'Uniswap API key not configured. Set UNISWAP_API_KEY env var. Get one at https://developers.uniswap.org/dashboard/',
          routerAddress: '0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4',
        },
        status: 'api_key_required',
      })
    }

    const res = await fetch(UNISWAP_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-universal-router-version': '2.0',
      },
      body: JSON.stringify({
        type: 'EXACT_INPUT',
        amount: rawAmount,
        tokenInChainId: inToken.chainId.toString(),
        tokenOutChainId: outToken.chainId.toString(),
        tokenIn: inToken.address,
        tokenOut: outToken.address,
        swapper,
        autoSlippage: 'DEFAULT',
        routingPreference: 'BEST_PRICE',
      }),
    })

    const data = await res.json()

    return NextResponse.json({
      quote: {
        tokenIn: { symbol: tokenIn.toUpperCase(), address: inToken.address, amount },
        tokenOut: { symbol: tokenOut.toUpperCase(), address: outToken.address, amount: data.quote?.amountOut },
        route: data.route,
        gasEstimate: data.gasEstimate,
        priceImpact: data.priceImpact,
      },
      raw: data,
      status: 'ok',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    description: 'Uniswap Trading API quote endpoint for MoltFi',
    usage: 'POST with { tokenIn, tokenOut, amount, swapper }',
    supportedTokens: Object.keys(TOKENS),
    chain: 'Base Sepolia (84532)',
    docs: 'https://docs.uniswap.org/api/trading/overview',
  })
}
