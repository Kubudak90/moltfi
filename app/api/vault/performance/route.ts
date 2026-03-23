import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther, formatUnits, parseAbiItem } from 'viem'
import { base, baseSepolia } from 'viem/chains'

const sepoliaClient = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })
const mainnetClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') })

const SEPOLIA_ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as const
const MAINNET_ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as const
const WETH = '0x4200000000000000000000000000000000000006' as const
const SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const
const MAINNET_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const WSTETH = '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452' as const

const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

const swapEvent = parseAbiItem('event SwapExecuted(address indexed agent, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)')

export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  const chainParam = req.nextUrl.searchParams.get('chain')
  const isMainnet = chainParam === 'mainnet'
  if (!vault) return NextResponse.json({ error: 'vault required' }, { status: 400 })

  const client = isMainnet ? mainnetClient : sepoliaClient
  const ROUTER = isMainnet ? MAINNET_ROUTER : SEPOLIA_ROUTER
  const USDC = isMainnet ? MAINNET_USDC : SEPOLIA_USDC

  const safeRead = async (args: any, fallback: any = BigInt(0)) => {
    try { return await client.readContract(args) } catch { return fallback }
  }

  try {
    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > BigInt(9000) ? currentBlock - BigInt(9000) : BigInt(0)

    const swaps = await client.getLogs({
      address: ROUTER as `0x${string}`,
      event: swapEvent,
      fromBlock,
      toBlock: 'latest',
    }).catch(() => [])

    // Get current balances (sequential to avoid rate limiting)
    let ethBal = BigInt(0)
    try { ethBal = await client.getBalance({ address: vault as `0x${string}` }) } catch {}
    const wethBal = await safeRead({ address: WETH, abi: erc20Abi, functionName: 'balanceOf', args: [vault as `0x${string}`] })
    const usdcBal = await safeRead({ address: USDC as `0x${string}`, abi: erc20Abi, functionName: 'balanceOf', args: [vault as `0x${string}`] })
    const wstethBal = isMainnet
      ? await safeRead({ address: WSTETH as `0x${string}`, abi: erc20Abi, functionName: 'balanceOf', args: [vault as `0x${string}`] })
      : BigInt(0)

    // Get ETH price
    let ethPrice = 0
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd', { signal: AbortSignal.timeout(5000) })
      if (res.ok) { const data = await res.json(); ethPrice = data.ethereum?.usd || 0 }
    } catch {}
    if (!ethPrice) {
      try {
        const res = await fetch('https://api.coinbase.com/v2/exchange-rates?currency=ETH', { signal: AbortSignal.timeout(5000) })
        if (res.ok) { const data = await res.json(); ethPrice = parseFloat(data.data?.rates?.USD) || 0 }
      } catch {}
    }

    // Get Lido APR
    let lidoApr = 0
    try {
      const res = await fetch('https://eth-api.lido.fi/v1/protocol/steth/apr/sma')
      const data = await res.json()
      lidoApr = data.data.smaApr
    } catch {}

    const ethAmount = parseFloat(formatEther(ethBal))
    const wethAmount = parseFloat(formatEther(wethBal))
    const usdcAmount = parseFloat(formatUnits(usdcBal, 6))
    const wstethAmount = parseFloat(formatEther(wstethBal))

    const totalEthValue = (ethAmount + wethAmount + wstethAmount) * ethPrice
    const totalUsd = totalEthValue + usdcAmount

    const trades = swaps.map(log => {
      const args = log.args as any
      const tokenIn = args.tokenIn?.toLowerCase()
      const amountIn = args.amountIn || BigInt(0)
      const amountOut = args.amountOut || BigInt(0)

      const isEthIn = tokenIn === WETH.toLowerCase()
      const inAmount = isEthIn ? parseFloat(formatEther(amountIn)) : parseFloat(formatUnits(amountIn, 6))
      const outAmount = isEthIn ? parseFloat(formatUnits(amountOut, 6)) : parseFloat(formatEther(amountOut))

      const effectivePrice = isEthIn
        ? outAmount / inAmount
        : inAmount / outAmount

      return {
        direction: isEthIn ? 'SELL' as const : 'BUY' as const,
        ethAmount: isEthIn ? inAmount : outAmount,
        usdcAmount: isEthIn ? outAmount : inAmount,
        effectivePrice,
        blockNumber: Number(log.blockNumber),
      }
    })

    let tradingPnlUsd = 0
    let totalTraded = 0
    for (const t of trades) {
      if (t.direction === 'SELL') {
        tradingPnlUsd += (t.effectivePrice - ethPrice) * t.ethAmount
      } else {
        tradingPnlUsd += (ethPrice - t.effectivePrice) * t.ethAmount
      }
      totalTraded += t.usdcAmount
    }

    const firstTradeBlock = trades.length > 0 ? Math.min(...trades.map(t => t.blockNumber)) : Number(currentBlock)
    const blocksSinceFirst = Number(currentBlock) - firstTradeBlock
    const hoursSinceFirst = (blocksSinceFirst * 2) / 3600
    const daysSinceFirst = Math.max(hoursSinceFirst / 24, 0.01)

    const returnPct = totalUsd > 0 && tradingPnlUsd !== 0
      ? (tradingPnlUsd / totalUsd) * 100
      : null
    const annualizedReturn = daysSinceFirst >= 7 && returnPct !== null
      ? returnPct * (365 / daysSinceFirst)
      : null

    return NextResponse.json({
      vault,
      chain: isMainnet ? 'base' : 'base-sepolia',
      portfolio: {
        eth: ethAmount.toFixed(4),
        weth: wethAmount.toFixed(4),
        usdc: usdcAmount.toFixed(2),
        ...(isMainnet && { wstETH: wstethAmount.toFixed(4) }),
        totalUsd: totalUsd.toFixed(2),
        ethPrice,
      },
      performance: {
        tradingPnlUsd: tradingPnlUsd.toFixed(4),
        totalTraded: totalTraded.toFixed(2),
        tradeCount: trades.length,
        daysSinceFirst: daysSinceFirst.toFixed(2),
        returnPct: returnPct !== null ? returnPct.toFixed(2) : null,
        annualizedReturn: annualizedReturn !== null ? annualizedReturn.toFixed(2) : null,
      },
      benchmarks: {
        lidoApr: lidoApr.toFixed(2),
        eth24hChange: null,
      },
      trades: trades.map(t => ({
        direction: t.direction,
        ethAmount: t.ethAmount.toFixed(6),
        usdcAmount: t.usdcAmount.toFixed(2),
        effectivePrice: t.effectivePrice.toFixed(2),
        currentPrice: ethPrice.toFixed(2),
        pnl: t.direction === 'SELL'
          ? ((t.effectivePrice - ethPrice) * t.ethAmount).toFixed(4)
          : ((ethPrice - t.effectivePrice) * t.ethAmount).toFixed(4),
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
