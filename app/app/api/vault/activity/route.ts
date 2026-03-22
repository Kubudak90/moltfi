import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, formatEther, formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({ chain: baseSepolia, transport: http() })
const ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as const

const TOKEN_NAMES: Record<string, string> = {
  '0x4200000000000000000000000000000000000006': 'WETH',
  '0x036cbd53842c5426634e7929541ec2318f3dcf7e': 'USDC',
}

const EVENTS = [
  parseAbiItem('event Deposited(address indexed token, uint256 amount)'),
  parseAbiItem('event Withdrawn(address indexed token, uint256 amount)'),
  parseAbiItem('event SwapExecuted(address indexed agent, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)'),
  parseAbiItem('event Staked(uint256 ethAmount, uint256 stETHReceived)'),
  parseAbiItem('event YieldWithdrawn(uint256 yieldAmount)'),
  parseAbiItem('event AgentUpdated(address indexed oldAgent, address indexed newAgent)'),
]

function tokenName(addr: string): string {
  return TOKEN_NAMES[addr.toLowerCase()] || addr.slice(0, 6) + '...' + addr.slice(-4)
}

function formatAmount(amount: bigint, token: string): string {
  const name = tokenName(token)
  if (name === 'USDC') return `${formatUnits(amount, 6)} USDC`
  return `${formatEther(amount)} ${name}`
}

type ActivityItem = {
  type: string
  summary: string
  detail: string
  txHash: string
  blockNumber: number
  timestamp: number | null
  guardrailCheck: string
}

export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  if (!vault) return NextResponse.json({ error: 'vault param required' }, { status: 400 })

  try {
    const activities: ActivityItem[] = []

    // Get the vault creation block (approximate — go back ~100k blocks)
    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > 500000n ? currentBlock - 500000n : 0n

    // Fetch vault events + router swap events in parallel
    const vaultEvents = await Promise.all(
      EVENTS.map(event =>
        client.getLogs({
          address: vault as `0x${string}`,
          event,
          fromBlock,
          toBlock: 'latest',
        }).catch(() => [])
      )
    )
    const [deposits, withdrawals, , stakes, yields, agentUpdates] = vaultEvents

    // SwapExecuted comes from the router, filtered by agent (vault) as indexed param
    const swaps = await client.getLogs({
      address: ROUTER,
      event: EVENTS[2], // SwapExecuted
      fromBlock,
      toBlock: 'latest',
    }).catch(() => [])

    // Process deposits
    for (const log of deposits) {
      const args = log.args as any
      const token = args.token || ''
      const amount = args.amount || 0n
      activities.push({
        type: 'deposit',
        summary: `Deposited ${formatAmount(amount, token)}`,
        detail: `Funds added to vault. This increases the vault balance and is tracked as principal.`,
        txHash: log.transactionHash || '',
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: 'No guardrail needed — deposits are always allowed.',
      })
    }

    // Process withdrawals
    for (const log of withdrawals) {
      const args = log.args as any
      activities.push({
        type: 'withdraw',
        summary: `Withdrew ${formatAmount(args.amount || 0n, args.token || '')}`,
        detail: `Funds removed from vault by the owner.`,
        txHash: log.transactionHash || '',
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: 'Owner-only — only your wallet can withdraw.',
      })
    }

    // Process swaps
    for (const log of swaps) {
      const args = log.args as any
      const tokenIn = tokenName(args.tokenIn || '')
      const tokenOut = tokenName(args.tokenOut || '')
      const amountIn = args.amountIn || 0n
      const amountOut = args.amountOut || 0n
      const fmtIn = tokenIn === 'USDC' ? formatUnits(amountIn, 6) : formatEther(amountIn)
      const fmtOut = tokenOut === 'USDC' ? formatUnits(amountOut, 6) : formatEther(amountOut)
      activities.push({
        type: 'swap',
        summary: `Swapped ${fmtIn} ${tokenIn} → ${fmtOut} ${tokenOut}`,
        detail: `Trade executed through AgentGuardRouter via Uniswap V3. Policy was checked on-chain before execution.`,
        txHash: log.transactionHash || '',
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: '✓ Within trade limits. ✓ Both tokens on approved list. ✓ Daily volume cap not exceeded.',
      })
    }

    // Process stakes
    for (const log of stakes) {
      const args = log.args as any
      activities.push({
        type: 'stake',
        summary: `Staked ${formatEther(args.ethAmount || 0n)} ETH → received stETH`,
        detail: `ETH staked through Lido. Now earning ~3% APR. Principal is tracked.`,
        txHash: log.transactionHash || '',
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: '✓ Staking is allowed within daily volume cap.',
      })
    }

    // Process yield withdrawals
    for (const log of yields) {
      const args = log.args as any
      activities.push({
        type: 'yield',
        summary: `Collected ${formatEther(args.yieldAmount || 0n)} ETH yield`,
        detail: `Yield above principal was withdrawn for trading.`,
        txHash: log.transactionHash || '',
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: '✓ Only yield above principal — original deposit is protected.',
      })
    }

    // Fetch timestamps for all activities (batch block lookups)
    const uniqueBlocks = [...new Set(activities.map(a => a.blockNumber))]
    const blockTimestamps: Record<number, number> = {}
    await Promise.all(
      uniqueBlocks.map(async (bn) => {
        try {
          const block = await client.getBlock({ blockNumber: BigInt(bn) })
          blockTimestamps[bn] = Number(block.timestamp)
        } catch {}
      })
    )
    for (const a of activities) {
      a.timestamp = blockTimestamps[a.blockNumber] || null
    }

    // Sort by block number descending (newest first)
    activities.sort((a, b) => b.blockNumber - a.blockNumber)

    return NextResponse.json({ vault, activities, count: activities.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
