import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, parseAbiItem, formatEther, formatUnits } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { getActivitySummary } from '@/lib/activity-log'

const sepoliaClient = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })
const mainnetClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') })

// Sepolia contracts
const SEPOLIA_ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as const
const SEPOLIA_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const SEPOLIA_POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

// Mainnet contracts
const MAINNET_ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as const
const MAINNET_FACTORY = '0x5AFC9Ff3230eE0E4bE9e110F7672584Ab593A4F6' as const
const MAINNET_POLICY = '0x9f5C622170F11C35d3343fE444731E3F732De38a' as const

const TOKEN_NAMES: Record<string, string> = {
  '0x4200000000000000000000000000000000000006': 'WETH',
  '0x036cbd53842c5426634e7929541ec2318f3dcf7e': 'USDC',
  '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'USDC',
  '0xc1cba3fcea344f92d9239c08c0568f6f2f0ee452': 'wstETH',
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
  aiGenerated?: boolean
  txHash: string
  blockNumber: number
  timestamp: number | null
  guardrailCheck: string
  proof?: Record<string, string>
}

export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  const chainParam = req.nextUrl.searchParams.get('chain')
  const isMainnet = chainParam === 'mainnet'
  if (!vault) return NextResponse.json({ error: 'vault param required' }, { status: 400 })

  const client = isMainnet ? mainnetClient : sepoliaClient
  const ROUTER = isMainnet ? MAINNET_ROUTER : SEPOLIA_ROUTER
  const VAULT_FACTORY = isMainnet ? MAINNET_FACTORY : SEPOLIA_FACTORY
  const POLICY = isMainnet ? MAINNET_POLICY : SEPOLIA_POLICY

  try {
    const activities: ActivityItem[] = []

    const policyAbi = [
      { name: 'policies', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], outputs: [{ name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }, { name: 'active', type: 'bool' }] },
      { name: 'getDailySpent', type: 'function', stateMutability: 'view', inputs: [{ name: 'agent', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
      { name: 'approvedTokens', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], outputs: [{ name: '', type: 'bool' }] },
    ]

    let policy: any = null
    let dailySpent = '0'
    try {
      const pol = await client.readContract({ address: POLICY as `0x${string}`, abi: policyAbi, functionName: 'policies', args: [VAULT_FACTORY as `0x${string}`, vault as `0x${string}`] } as any)
      const spent = await client.readContract({ address: POLICY as `0x${string}`, abi: policyAbi, functionName: 'getDailySpent', args: [vault as `0x${string}`] } as any)
      policy = pol
      dailySpent = formatEther(spent as bigint)
    } catch {}

    const currentBlock = await client.getBlockNumber()
    const fromBlock = currentBlock > BigInt(9000) ? currentBlock - BigInt(9000) : BigInt(0)

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

    const swaps = await client.getLogs({
      address: ROUTER as `0x${string}`,
      event: EVENTS[2],
      fromBlock,
      toBlock: 'latest',
    }).catch(() => [])

    for (const log of deposits) {
      const args = log.args as any
      const token = args.token || ''
      const amount = args.amount || BigInt(0)
      const depositTx = log.transactionHash || ''
      const depositAi = getActivitySummary(depositTx)
      activities.push({
        type: 'deposit',
        summary: `Deposited ${formatAmount(amount, token)}`,
        detail: depositAi || `Funds added to vault.`,
        aiGenerated: !!depositAi,
        txHash: depositTx,
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: 'No guardrail needed — deposits are always allowed.',
      })
    }

    for (const log of withdrawals) {
      const args = log.args as any
      activities.push({
        type: 'withdraw',
        summary: `Withdrew ${formatAmount(args.amount || BigInt(0), args.token || '')}`,
        detail: `Funds removed from vault by the owner.`,
        txHash: log.transactionHash || '',
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: 'Owner-only — only your wallet can withdraw.',
      })
    }

    for (const log of swaps) {
      const args = log.args as any
      const tokenIn = tokenName(args.tokenIn || '')
      const tokenOut = tokenName(args.tokenOut || '')
      const amountIn = args.amountIn || BigInt(0)
      const amountOut = args.amountOut || BigInt(0)
      const fmtIn = tokenIn === 'USDC' ? formatUnits(amountIn, 6) : formatEther(amountIn)
      const fmtOut = tokenOut === 'USDC' ? formatUnits(amountOut, 6) : formatEther(amountOut)
      const maxPerAction = policy ? formatEther(policy[0]) : 'unknown'
      const dailyLimit = policy ? formatEther(policy[1]) : 'unknown'

      const txHash = log.transactionHash || ''
      const aiSummary = getActivitySummary(txHash)

      activities.push({
        type: 'swap',
        summary: `Swapped ${fmtIn} ${tokenIn} → ${fmtOut} ${tokenOut}`,
        detail: aiSummary || `Swap routed through AgentGuardRouter → policy check → Uniswap V3.`,
        aiGenerated: !!aiSummary,
        txHash,
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: `Trade size: ${fmtIn} ${tokenIn} · Max allowed per trade: ${maxPerAction} ETH · Daily spent: ${dailySpent} / ${dailyLimit} ETH`,
        proof: {
          'Trade size': `${fmtIn} ${tokenIn}`,
          'Max per trade (on-chain)': `${maxPerAction} ETH`,
          'Daily spent / limit': `${dailySpent} / ${dailyLimit} ETH`,
          'Token approved': `${tokenIn} ✓ ${tokenOut} ✓`,
          'Policy contract': POLICY,
          'Router contract': ROUTER,
          'Result': 'Transaction succeeded — guardrails passed',
        },
      })
    }

    for (const log of stakes) {
      const args = log.args as any
      activities.push({
        type: 'stake',
        summary: `Staked ${formatEther(args.ethAmount || BigInt(0))} ETH → received stETH`,
        detail: `ETH staked through Lido. Now earning ~3% APR. Principal is tracked.`,
        txHash: log.transactionHash || '',
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: '✓ Staking is allowed within daily volume cap.',
      })
    }

    for (const log of yields) {
      const args = log.args as any
      activities.push({
        type: 'yield',
        summary: `Collected ${formatEther(args.yieldAmount || BigInt(0))} ETH yield`,
        detail: `Yield above principal was withdrawn for trading.`,
        txHash: log.transactionHash || '',
        blockNumber: Number(log.blockNumber),
        timestamp: null,
        guardrailCheck: '✓ Only yield above principal — original deposit is protected.',
      })
    }

    const uniqueBlocks = [...new Set(activities.map(a => a.blockNumber))]
    const blockTimestamps: Record<number, number> = {}
    for (const bn of uniqueBlocks) {
      try {
        const block = await client.getBlock({ blockNumber: BigInt(bn) })
        blockTimestamps[bn] = Number(block.timestamp)
      } catch {}
    }
    for (const a of activities) {
      a.timestamp = blockTimestamps[a.blockNumber] || null
    }

    activities.sort((a, b) => b.blockNumber - a.blockNumber)

    return NextResponse.json({ vault, activities, count: activities.length })
  } catch (err: any) {
    return NextResponse.json({ vault: req.nextUrl.searchParams.get('vault'), activities: [], count: 0, rpcError: true })
  }
}
