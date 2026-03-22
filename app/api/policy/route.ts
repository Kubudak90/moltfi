import { NextResponse } from 'next/server'
import { createPublicClient, http, formatEther, parseAbi } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })

const CONTRACT = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as `0x${string}`
const ROUTER = '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' as `0x${string}`
const HUMAN = '0x90d9c75f3761c02Bf3d892A701846F6323e9112D' as `0x${string}`  // Policy setter
const AGENT = '0x90d9c75f3761c02Bf3d892A701846F6323e9112D' as `0x${string}`   // Agent wallet (demo: same wallet)
const WETH = '0x4200000000000000000000000000000000000006' as `0x${string}`
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`

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

export async function GET() {
  try {
    // Read policy from chain
    const [policy, owner, wethApproved, usdcApproved, dailySpent, remaining] = await Promise.all([
      client.readContract({ address: CONTRACT, abi: ABI, functionName: 'policies', args: [HUMAN, AGENT] } as any),
      client.readContract({ address: CONTRACT, abi: ABI, functionName: 'agentOwner', args: [AGENT] } as any),
      client.readContract({ address: CONTRACT, abi: ABI, functionName: 'approvedTokens', args: [AGENT, WETH] } as any),
      client.readContract({ address: CONTRACT, abi: ABI, functionName: 'approvedTokens', args: [AGENT, USDC] } as any),
      client.readContract({ address: CONTRACT, abi: ABI, functionName: 'getDailySpent', args: [AGENT] } as any),
      client.readContract({ address: CONTRACT, abi: ABI, functionName: 'getRemainingAllowance', args: [AGENT] } as any),
    ])

    return NextResponse.json({
      policyContract: CONTRACT,
      routerContract: ROUTER,
      chain: 'Base Sepolia',
      chainId: 84532,
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
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
