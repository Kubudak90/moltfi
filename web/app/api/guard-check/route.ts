import { NextResponse } from 'next/server'
import { parseEther, formatEther } from 'viem'

export const dynamic = 'force-dynamic'

/**
 * Simulates what AgentGuard.sol's beforeSwap() would do on-chain.
 * This is pure math against user-provided policy params — NOT mock data.
 * The same logic lives in the Solidity contract; this lets the frontend
 * preview enforcement without an on-chain call.
 *
 * All inputs come from the user. No hardcoded values.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      swapAmountEth,
      maxPerSwapEth,
      dailyLimitEth,
      dailySpentEth = 0,
      tokenIn = 'WETH',
      approvedTokens = ['WETH', 'USDC'],
    } = body

    if (swapAmountEth == null || maxPerSwapEth == null || dailyLimitEth == null) {
      return NextResponse.json(
        { error: 'Required: swapAmountEth, maxPerSwapEth, dailyLimitEth' },
        { status: 400 }
      )
    }

    const swapAmount = parseEther(String(swapAmountEth))
    const maxPerSwap = parseEther(String(maxPerSwapEth))
    const dailyLimit = parseEther(String(dailyLimitEth))
    const dailySpent = parseEther(String(dailySpentEth))

    const checks = []

    // Check 1: Token approved?
    const tokenApproved = approvedTokens.includes(tokenIn)
    checks.push({
      name: 'Token Approved',
      passed: tokenApproved,
      detail: tokenApproved
        ? `${tokenIn} is in approved list`
        : `${tokenIn} is NOT in approved list [${approvedTokens.join(', ')}]`,
    })

    // Check 2: Under per-swap limit?
    const underPerSwap = swapAmount <= maxPerSwap
    checks.push({
      name: 'Per-Swap Limit',
      passed: underPerSwap,
      detail: `${swapAmountEth} ETH ${underPerSwap ? '≤' : '>'} ${maxPerSwapEth} ETH max`,
    })

    // Check 3: Under daily limit?
    const newDailyTotal = dailySpent + swapAmount
    const underDaily = newDailyTotal <= dailyLimit
    checks.push({
      name: 'Daily Limit',
      passed: underDaily,
      detail: `${formatEther(newDailyTotal)} ETH total today ${underDaily ? '≤' : '>'} ${dailyLimitEth} ETH max (already spent: ${dailySpentEth} ETH)`,
    })

    const allowed = tokenApproved && underPerSwap && underDaily

    return NextResponse.json({
      allowed,
      checks,
      summary: allowed
        ? `✅ SWAP ALLOWED — ${swapAmountEth} ETH ${tokenIn} passes all AgentGuard checks`
        : `❌ SWAP BLOCKED — ${checks.filter(c => !c.passed).map(c => c.name).join(', ')} failed`,
      contractLogic: 'AgentGuard.sol beforeSwap() — same checks enforced on-chain',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
