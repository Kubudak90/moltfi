import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther, parseAbi } from 'viem'
import { base, baseSepolia } from 'viem/chains'

const sepoliaClient = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })
const mainnetClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') })

// Sepolia contracts
const SEPOLIA_CONTRACT = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as `0x${string}`
const SEPOLIA_ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as `0x${string}`
const SEPOLIA_USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`

// Mainnet contracts
const MAINNET_CONTRACT = '0x9f5C622170F11C35d3343fE444731E3F732De38a' as `0x${string}`
const MAINNET_ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as `0x${string}` // same or different?
const MAINNET_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as `0x${string}`

const WETH = '0x4200000000000000000000000000000000000006' as `0x${string}`

const ABI = parseAbi([
  'function policies(address, address) view returns (uint256 maxPerAction, uint256 dailyLimit, bool active)',
  'function dailySpent(address, uint256) view returns (uint256)',
  'function agentOwner(address) view returns (address)',
  'function approvedTokens(address, address) view returns (bool)',
  'function getDailySpent(address) view returns (uint256)',
  'function getRemainingAllowance(address) view returns (uint256)',
  'function checkAction(address, address, uint256) view returns (bool allowed, string reason)',
])

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  const chainParam = req.nextUrl.searchParams.get('chain')
  const isMainnet = chainParam === 'mainnet'
  const client = isMainnet ? mainnetClient : sepoliaClient
  const CONTRACT = isMainnet ? MAINNET_CONTRACT : SEPOLIA_CONTRACT
  const ROUTER = isMainnet ? MAINNET_ROUTER : SEPOLIA_ROUTER
  const usdcAddr = isMainnet ? MAINNET_USDC : SEPOLIA_USDC

  // Use vault address as the agent for policy lookups
  const AGENT = vault as `0x${string}` || '0x0000000000000000000000000000000000000000' as `0x${string}`
  // Policy setter is the factory
  const HUMAN = isMainnet ? '0x5AFC9Ff3230eE0E4bE9e110F7672584Ab593A4F6' : '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774'

  try {
    const contracts = [
      { address: CONTRACT, abi: ABI, functionName: 'policies' as const, args: [HUMAN, AGENT] },
      { address: CONTRACT, abi: ABI, functionName: 'agentOwner' as const, args: [AGENT] },
      { address: CONTRACT, abi: ABI, functionName: 'approvedTokens' as const, args: [AGENT, WETH] },
      { address: CONTRACT, abi: ABI, functionName: 'approvedTokens' as const, args: [AGENT, usdcAddr] },
      { address: CONTRACT, abi: ABI, functionName: 'getDailySpent' as const, args: [AGENT] },
      { address: CONTRACT, abi: ABI, functionName: 'getRemainingAllowance' as const, args: [AGENT] },
    ]
    let results: any
    try {
      results = await (client as any).multicall({ contracts: contracts as any, allowFailure: true })
    } catch {
      return NextResponse.json({ error: 'RPC unavailable' }, { status: 503 })
    }
    const get = (i: number, fallback: any = BigInt(0)) => results[i]?.status === 'success' ? results[i].result : fallback
    const policy = get(0, [BigInt(0), BigInt(0), false])
    const owner = get(1, '0x0')
    const wethApproved = get(2, false)
    const usdcApproved = get(3, false)
    const dailySpent = get(4)
    const remaining = get(5)

    return NextResponse.json({
      policyContract: CONTRACT,
      routerContract: ROUTER,
      chain: isMainnet ? 'Base' : 'Base Sepolia',
      chainId: isMainnet ? 8453 : 84532,
      human: HUMAN,
      agent: AGENT,
      policy: {
        maxPerAction: formatEther((policy as any)[0]),
        dailyLimit: formatEther((policy as any)[1]),
        active: (policy as any)[2],
      },
      owner,
      approvedTokens: {
        WETH: wethApproved,
        USDC: usdcApproved,
      },
      dailySpent: formatEther(dailySpent as bigint),
      remainingAllowance: formatEther(remaining as bigint),
      timestamp: new Date().toISOString(),
    })
  } catch (e) {
    // Return defaults on RPC failure so UI doesn't crash
    return NextResponse.json({
      policy: { maxPerAction: '0', dailyLimit: '0', active: false, dailySpent: '0', remaining: '0' },
      approvedTokens: {},
      rpcError: true,
    })
  }
}
