import { NextResponse } from 'next/server'
import { createPublicClient, http, formatEther, formatUnits, parseAbi } from 'viem'
import { base, mainnet, celo } from 'viem/chains'

const baseClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') })
const mainnetClient = createPublicClient({ chain: mainnet, transport: http('https://ethereum-rpc.publicnode.com') })
const celoClient = createPublicClient({ chain: celo, transport: http('https://forno.celo.org') })

export const dynamic = 'force-dynamic'

export async function GET() {
  const errors: string[] = []

  // Lido stETH APR — real API
  let lido: any = null
  try {
    const res = await fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma')
    if (res.ok) {
      const data = await res.json() as any
      lido = {
        smaApr: data.data?.smaApr,
        latestApr: data.data?.aprs?.[data.data.aprs.length - 1]?.apr,
        history: data.data?.aprs?.map((a: any) => ({
          date: new Date(a.timeUnix * 1000).toISOString().slice(0, 10),
          apr: a.apr,
        })),
      }
    }
  } catch (e) { errors.push(`lido: ${e}`) }

  // ETH price — CoinGecko free API
  let prices: any = null
  try {
    const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum,usd-coin&vs_currencies=usd&include_24hr_change=true')
    if (res.ok) {
      const data = await res.json() as any
      prices = {
        eth: data.ethereum?.usd,
        eth24hChange: data.ethereum?.usd_24h_change,
        usdc: data['usd-coin']?.usd,
      }
    }
  } catch (e) { errors.push(`prices: ${e}`) }

  // Base gas price — real RPC call
  let baseGas: any = null
  try {
    const gasPrice = await baseClient.getGasPrice()
    baseGas = {
      gwei: (Number(gasPrice) / 1e9).toFixed(4),
      wei: gasPrice.toString(),
    }
  } catch (e) { errors.push(`baseGas: ${e}`) }

  // Base latest block — real RPC call
  let baseBlock: number | null = null
  try {
    baseBlock = Number(await baseClient.getBlockNumber())
  } catch (e) { errors.push(`baseBlock: ${e}`) }

  // Celo cUSD total supply — real on-chain contract read
  let celoData: any = null
  try {
    const cUSD = '0x765DE816845861e75A25fCA122bb6898B8B1282a' as `0x${string}`
    const supply = await celoClient.readContract({
      address: cUSD,
      abi: parseAbi(['function totalSupply() view returns (uint256)']),
      functionName: 'totalSupply',
    } as any)
    celoData = { cUsdSupply: formatUnits(supply as bigint, 18) }
  } catch (e) { errors.push(`celo: ${e}`) }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    lido,
    prices,
    baseGas,
    baseBlock,
    celo: celoData,
    errors: errors.length ? errors : undefined,
  })
}
