import { NextResponse } from 'next/server'
import { createPublicClient, http, formatUnits, parseAbi } from 'viem'
import { base, celo } from 'viem/chains'

const baseClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') })
const celoClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') })

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, any> = {}
  const errors: string[] = []

  // Lido stETH APR — real API
  try {
    const res = await fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma')
    if (res.ok) {
      const data = await res.json() as any
      results.lido = {
        smaApr: Number(data.data?.smaApr?.toFixed(2)),
        latestApr: Number(data.data?.aprs?.[data.data.aprs.length - 1]?.apr?.toFixed(2)),
        history: data.data?.aprs?.map((a: any) => ({
          date: new Date(a.timeUnix * 1000).toISOString().slice(0, 10),
          apr: Number(a.apr.toFixed(3)),
        })),
      }
    } else {
      errors.push(`Lido API: ${res.status}`)
    }
  } catch (e) {
    errors.push(`Lido: ${e}`)
  }

  // ETH + USDC prices — CoinGecko free API
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=usd&include_24hr_change=true'
    )
    if (res.ok) {
      const data = await res.json() as any
      results.prices = {
        eth: data.ethereum?.usd,
        eth24hChange: Number(data.ethereum?.usd_24h_change?.toFixed(2)),
        usdc: data['usd-coin']?.usd,
      }
    } else {
      errors.push(`CoinGecko: ${res.status}`)
    }
  } catch (e) {
    errors.push(`CoinGecko: ${e}`)
  }

  // Base gas price — real RPC call
  try {
    const gasPrice = await baseClient.getGasPrice()
    results.baseGas = {
      gwei: Number((Number(gasPrice) / 1e9).toFixed(4)),
      wei: gasPrice.toString(),
    }
  } catch (e) {
    errors.push(`Base gas: ${e}`)
  }

  // Base block number — real RPC call
  try {
    results.baseBlock = Number(await baseClient.getBlockNumber())
  } catch (e) {
    errors.push(`Base block: ${e}`)
  }

  // Celo cUSD total supply — real on-chain contract read
  try {
    const supply = await celoClient.readContract({
      address: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
      abi: parseAbi(['function totalSupply() view returns (uint256)']),
      functionName: 'totalSupply',
    })
    results.celo = {
      cUsdSupply: Number(formatUnits(supply, 18)).toLocaleString('en-US', { maximumFractionDigits: 0 }),
    }
  } catch (e) {
    errors.push(`Celo: ${e}`)
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    source: 'live',
    ...results,
    ...(errors.length > 0 ? { errors } : {}),
  })
}
