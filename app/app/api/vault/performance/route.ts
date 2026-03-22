import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther, formatUnits, parseAbiItem } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({ chain: baseSepolia, transport: http() })
const ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as const
const WETH = '0x4200000000000000000000000000000000000006' as const
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const

const erc20Abi = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }], outputs: [{ type: 'uint256' }] },
] as const

const swapEvent = parseAbiItem('event SwapExecuted(address indexed agent, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)')

export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  if (!vault) return NextResponse.json({ error: 'vault required' }, { status: 400 })

  try {
    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > 9000n ? currentBlock - 9000n : 0n

    // Get all swap events from router
    const swaps = await client.getLogs({
      address: ROUTER,
      event: swapEvent,
      fromBlock,
      toBlock: 'latest',
    }).catch(() => [])

    // Get current balances
    const [ethBal, wethBal, usdcBal] = await Promise.all([
      client.getBalance({ address: vault as `0x${string}` }),
      client.readContract({ address: WETH, abi: erc20Abi, functionName: 'balanceOf', args: [vault as `0x${string}`] }),
      client.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [vault as `0x${string}`] }),
    ])

    // Get ETH price — try CoinGecko, fallback to Coinbase
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

    // Calculate total portfolio value in USD
    const totalEthValue = (ethAmount + wethAmount) * ethPrice
    const totalUsd = totalEthValue + usdcAmount

    // Process trade history for performance metrics
    const trades = swaps.map(log => {
      const args = log.args as any
      const tokenIn = args.tokenIn?.toLowerCase()
      const tokenOut = args.tokenOut?.toLowerCase()
      const amountIn = args.amountIn || 0n
      const amountOut = args.amountOut || 0n

      const isEthIn = tokenIn === WETH.toLowerCase()
      const inAmount = isEthIn ? parseFloat(formatEther(amountIn)) : parseFloat(formatUnits(amountIn, 6))
      const outAmount = isEthIn ? parseFloat(formatUnits(amountOut, 6)) : parseFloat(formatEther(amountOut))

      // Effective price: how much USD per ETH did we get/pay
      const effectivePrice = isEthIn
        ? outAmount / inAmount  // sold ETH, got USDC
        : inAmount / outAmount  // bought ETH, paid USDC

      return {
        direction: isEthIn ? 'SELL' : 'BUY',
        ethAmount: isEthIn ? inAmount : outAmount,
        usdcAmount: isEthIn ? outAmount : inAmount,
        effectivePrice,
        blockNumber: Number(log.blockNumber),
      }
    })

    // Calculate trading P&L
    // For each sell: compare effective price vs current price
    // For each buy: compare current price vs effective price
    let tradingPnlUsd = 0
    let totalTraded = 0
    for (const t of trades) {
      if (t.direction === 'SELL') {
        // Sold ETH at effectivePrice, could buy back now at ethPrice
        // If effectivePrice > ethPrice: profit (sold high)
        tradingPnlUsd += (t.effectivePrice - ethPrice) * t.ethAmount
      } else {
        // Bought ETH at effectivePrice, worth ethPrice now
        tradingPnlUsd += (ethPrice - t.effectivePrice) * t.ethAmount
      }
      totalTraded += t.usdcAmount
    }

    // Vault age (from first block in range to now, approximate)
    const firstTradeBlock = trades.length > 0 ? Math.min(...trades.map(t => t.blockNumber)) : Number(currentBlock)
    const blocksSinceFirst = Number(currentBlock) - firstTradeBlock
    const hoursSinceFirst = (blocksSinceFirst * 2) / 3600 // ~2s blocks on Base
    const daysSinceFirst = Math.max(hoursSinceFirst / 24, 0.01)

    // Return calculation — don't annualize unless we have enough history
    // Show actual P&L % for short periods, only annualize after 7+ days
    const returnPct = totalUsd > 0 && tradingPnlUsd !== 0
      ? (tradingPnlUsd / totalUsd) * 100
      : null
    const annualizedReturn = daysSinceFirst >= 7 && returnPct !== null
      ? returnPct * (365 / daysSinceFirst)
      : null

    return NextResponse.json({
      vault,
      portfolio: {
        eth: ethAmount.toFixed(4),
        weth: wethAmount.toFixed(4),
        usdc: usdcAmount.toFixed(2),
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
        eth24hChange: ethPrice > 0 ? null : null, // filled by frontend from rates context
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
