'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { useRouter } from 'next/navigation'
import { useAgentContext } from '../components/AgentContext'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const POLICY_CONTRACT = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

const factoryAbi = [
  { name: 'updatePolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }, { name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }], outputs: [] },
  { name: 'revokePolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }], outputs: [] },
] as const

type Strategy = {
  name: string; description: string; expectedYield: string
  steps: string[]
  guardrails: { maxTradeSize: string; dailyLimit: string; maxSlippage: string; protocols: string[] }
}

type Activity = {
  type: string; summary: string; txHash: string; blockNumber: number; timestamp: number | null
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function shortenAddr(addr: string): string {
  return addr.slice(0, 6) + '…' + addr.slice(-4)
}

export default function StrategyPage() {
  const { address } = useAccount()
  const { vaults, vaultData, rates, hasVault } = useAgentContext()
  const router = useRouter()
  const fetchRef = useRef<AbortController | null>(null)

  // On-chain source of truth
  const policyActive = vaultData?.policy?.active === true
  const policyMaxPerAction = vaultData?.policy?.maxPerAction
  const policyDailyLimit = vaultData?.policy?.dailyLimit
  const policyDailySpent = vaultData?.policy?.dailySpent
  const policyRemaining = vaultData?.policy?.remaining

  // Cached strategy details — browser only (privacy: we don't store strategies server-side)
  const [cachedStrategy, setCachedStrategy] = useState<Strategy | null>(() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('ag_active_strategy') || 'null') } catch { return null }
  })
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('ag_strategies') || '[]') } catch { return [] }
  })
  const [generatedAt, setGeneratedAt] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem('ag_strategies_ts') || '0')
  })
  const [generating, setGenerating] = useState(false)
  const [deployTxHash, setDeployTxHash] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('ag_deploy_tx') || null
  })
  const [deployedAt, setDeployedAt] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem('ag_deployed_at') || '0')
  })
  const [showGenerate, setShowGenerate] = useState(false)
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [txStatus, setTxStatus] = useState('')

  const { writeContract, data: txHash } = useWriteContract()
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  // Save tx hash when we get one from wagmi
  useEffect(() => {
    if (txHash) {
      setDeployTxHash(txHash)
      localStorage.setItem('ag_deploy_tx', txHash)
      const now = Date.now()
      setDeployedAt(now)
      localStorage.setItem('ag_deployed_at', String(now))
    }
  }, [txHash])

  // Fetch recent activity when policy is active
  useEffect(() => {
    if (!policyActive || !vaults[0]) return
    setActivityLoading(true)
    fetch(`/api/vault/activity?vault=${vaults[0]}`)
      .then(r => r.json())
      .then(d => { setRecentActivity((d.activities || []).slice(0, 3)); setActivityLoading(false) })
      .catch(() => setActivityLoading(false))
  }, [policyActive, vaults])

  // Check if a generation was in progress when we mounted
  useEffect(() => {
    const inProgress = localStorage.getItem('ag_generating')
    if (inProgress === 'true' && strategies.length === 0) {
      localStorage.removeItem('ag_generating')
      generate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const generate = useCallback(async () => {
    if (fetchRef.current) fetchRef.current.abort()
    const controller = new AbortController()
    fetchRef.current = controller

    setGenerating(true)
    setStrategies([])
    localStorage.setItem('ag_generating', 'true')
    localStorage.removeItem('ag_strategies')
    localStorage.removeItem('ag_strategies_ts')

    try {
      const balance = vaultData?.balances?.WETH || '0'
      const usdcBalance = vaultData?.balances?.USDC || '0'
      const lidoApr = rates?.lido ? `${rates.lido.smaApr.toFixed(2)}%` : 'unknown'
      const ep = rates?.prices?.eth ? `$${rates.prices.eth.toLocaleString()}` : 'unknown'
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ messages: [{ role: 'user',
          content: `You are an autonomous AI DeFi agent for MoltFi on Base. The user has a vault with ${balance} WETH and ${usdcBalance} USDC. Current data: ETH price ${ep}, Lido stETH APR ${lidoApr}.

Available protocols: Lido (ETH staking via stETH), Uniswap V3 (token swaps). Only these two — do not reference any other protocols.

Generate exactly 3 strategies that YOU will execute autonomously. Once approved, you run continuously — checking yields, rebalancing, making trades. Guardrails enforced on-chain.

Plain English — the user knows nothing about DeFi.

Return EXACTLY this format for each, no other text:

\`\`\`strategy
{
  "name": "Strategy Name",
  "description": "What I'll do with your money, plain English",
  "expectedYield": "X-Y% APR",
  "steps": ["What I'll actively do", "What I'll monitor"],
  "guardrails": {
    "maxTradeSize": "0.5 ETH",
    "dailyLimit": "2 ETH",
    "maxSlippage": "1%",
    "protocols": ["Lido", "Uniswap V3"]
  }
}
\`\`\`

Strategy 1: Safe. Strategy 2: Balanced. Strategy 3: Aggressive.` }] })
      })
      const data = await res.json()
      if (data.reply) {
        const parsed: Strategy[] = []
        for (const match of data.reply.matchAll(/```strategy\n([\s\S]*?)\n```/g)) {
          try { parsed.push(JSON.parse(match[1])) } catch {}
        }
        const now = Date.now()
        setStrategies(parsed)
        setGeneratedAt(now)
        localStorage.setItem('ag_strategies', JSON.stringify(parsed))
        localStorage.setItem('ag_strategies_ts', String(now))
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return
    }
    setGenerating(false)
    localStorage.removeItem('ag_generating')
  }, [vaultData, rates])

  useEffect(() => {
    return () => { fetchRef.current?.abort() }
  }, [])

  const deploy = (s: Strategy) => {
    if (!vaults[0]) return
    setTxStatus('Confirm in your wallet — writing guardrails to the policy contract...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'updatePolicy',
      args: [vaults[0] as `0x${string}`, parseEther(s.guardrails.maxTradeSize.replace(' ETH', '')),
        parseEther(s.guardrails.dailyLimit.replace(' ETH', ''))], chain: baseSepolia })
    setCachedStrategy(s)
    setShowGenerate(false)
    localStorage.setItem('ag_active_strategy', JSON.stringify(s))
  }

  const pause = () => {
    if (!vaults[0]) return
    setTxStatus('Confirm in your wallet — revoking agent policy on-chain...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'revokePolicy',
      args: [vaults[0] as `0x${string}`], chain: baseSepolia })
    setCachedStrategy(null)
    setDeployTxHash(null)
    setDeployedAt(0)
    localStorage.removeItem('ag_active_strategy')
    localStorage.removeItem('ag_deploy_tx')
    localStorage.removeItem('ag_deployed_at')
  }

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to view strategies.</div>
  if (!hasVault) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Create a vault first in the Vault tab.</div>

  const vaultAddr = vaults[0] || ''

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {txStatus && (
        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-4 text-sm text-indigo-300">
          {txConfirmed ? '✓ Transaction confirmed on Base Sepolia' : txStatus}
          {txHash && (
            <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener"
              className="ml-2 text-indigo-400 hover:underline">View tx →</a>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategy</h1>
          <p className="text-sm text-gray-500">Manage your vault&apos;s trading strategy and on-chain guardrails</p>
        </div>
      </div>

      {/* ============================================ */}
      {/* ACTIVE POLICY — on-chain source of truth     */}
      {/* ============================================ */}
      {policyActive && !showGenerate && (
        <div className="space-y-4">
          {/* Current strategy status */}
          <div className="bg-gray-900 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                <span className="font-semibold text-lg text-green-400">
                  {cachedStrategy ? cachedStrategy.name : 'Trading Policy Active'}
                </span>
              </div>
              {cachedStrategy?.expectedYield && (
                <span className="text-sm font-medium text-yellow-400">{cachedStrategy.expectedYield}</span>
              )}
            </div>

            {/* Strategy description — what the agent is actually doing */}
            {cachedStrategy ? (
              <div className="mb-5">
                <p className="text-sm text-gray-300 mb-3">{cachedStrategy.description}</p>
                {cachedStrategy.steps && cachedStrategy.steps.length > 0 && (
                  <div className="bg-gray-800/40 rounded-lg p-4">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">What the agent does</div>
                    {cachedStrategy.steps.map((step, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm mb-1.5">
                        <span className="text-indigo-400 shrink-0">{j + 1}.</span>
                        <span className="text-gray-400">{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-5">
                <p className="text-sm text-gray-400">A trading policy is active on your vault. Strategy details are stored in your browser for privacy — if you cleared your cache, generate a new strategy or continue with the current guardrails.</p>
              </div>
            )}

            {/* Privacy distinction */}
            <div className="flex items-center gap-4 mb-5 text-xs">
              <div className="flex items-center gap-1.5 text-yellow-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                AI analysis is private (Venice, zero retention)
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Trades are public blockchain transactions
              </div>
            </div>

            {/* On-chain guardrails */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Max per trade</div>
                <div className="text-gray-200 font-medium">{policyMaxPerAction} ETH</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Daily limit</div>
                <div className="text-gray-200 font-medium">{policyDailyLimit} ETH</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Spent today</div>
                <div className="text-gray-200 font-medium">{policyDailySpent} ETH</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">Remaining today</div>
                <div className="text-gray-200 font-medium">{policyRemaining} ETH</div>
              </div>
            </div>

            {/* Verifiable links */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 mb-5">
              <span>Vault: <a href={`https://sepolia.basescan.org/address/${vaultAddr}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">{shortenAddr(vaultAddr)}</a></span>
              <span>Policy: <a href={`https://sepolia.basescan.org/address/${POLICY_CONTRACT}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">{shortenAddr(POLICY_CONTRACT)}</a></span>
              {deployTxHash && (
                <span>Deployed {deployedAt ? timeAgo(deployedAt) : ''}: <a href={`https://sepolia.basescan.org/tx/${deployTxHash}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">{deployTxHash.slice(0, 10)}…</a></span>
              )}
            </div>

            {/* Actions — prominent */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
              <button onClick={() => { setShowGenerate(true); setStrategies([]); setGeneratedAt(0) }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-5 py-2.5 rounded-lg text-sm font-medium transition">
                Change Strategy
              </button>
              <div className="ml-auto relative group">
                <button onClick={pause}
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-5 py-2.5 rounded-lg border border-red-500/30 transition text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pause Agent
                </button>
                <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-800 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                  Calls <code className="text-indigo-400">revokePolicy()</code> on the factory contract. The agent loses trading permissions on-chain. Funds stay in the vault.
                  <div className="absolute top-full right-4 -mt-px w-2 h-2 bg-gray-800 border-r border-b border-gray-800 rotate-45" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-300">Recent Vault Activity</div>
              <button onClick={() => router.push('/activity')} className="text-xs text-indigo-400 hover:underline">View all →</button>
            </div>
            {activityLoading && <div className="text-xs text-gray-600 py-3">Reading from blockchain…</div>}
            {!activityLoading && recentActivity.length === 0 && (
              <div className="text-xs text-gray-600 py-3">No transactions yet. Activity will appear here as the agent executes trades.</div>
            )}
            {recentActivity.map(tx => (
              <div key={tx.txHash} className="flex items-center justify-between py-2 border-t border-gray-800/50 text-sm">
                <div className="text-gray-300">{tx.summary}</div>
                <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                  {tx.timestamp && <span>{timeAgo(tx.timestamp * 1000)}</span>}
                  <a href={`https://sepolia.basescan.org/tx/${tx.txHash}`} target="_blank" rel="noopener"
                    className="text-indigo-400 hover:underline font-mono">{tx.txHash.slice(0, 8)}…</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* NO ACTIVE POLICY — show status + generate    */}
      {/* ============================================ */}
      {!policyActive && !showGenerate && strategies.length === 0 && !generating && (
        <div className="space-y-4">
          {/* Status: no policy */}
          <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="font-semibold text-yellow-400">No Active Strategy</span>
            </div>
            <p className="text-sm text-gray-400 mb-1">Your vault has no trading policy set. The agent can&apos;t execute any trades until you approve a strategy.</p>
            <div className="text-xs text-gray-600">
              Vault: <a href={`https://sepolia.basescan.org/address/${vaultAddr}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">{shortenAddr(vaultAddr)}</a>
              {' · '}Policy: <a href={`https://sepolia.basescan.org/address/${POLICY_CONTRACT}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">{shortenAddr(POLICY_CONTRACT)}</a>
              {' · '}<code className="text-gray-500">active: false</code>
            </div>
          </div>

          {/* Generate CTA */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-2">Get personalized DeFi strategies</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Venice AI analyzes your vault balance, current yields, and market conditions to propose strategies tailored to your portfolio.
              </p>
            </div>
            <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-start gap-3 text-left">
                <svg className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-gray-500">
                  Generated via Venice AI with <strong className="text-gray-400">zero data retention</strong>. Strategies are cached in your browser only — not on our servers.
                </p>
              </div>
            </div>
            <button onClick={generate}
              className="bg-indigo-600 hover:bg-indigo-600 px-8 py-3 rounded-lg font-medium transition text-lg">
              Show Me Strategies
            </button>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CHANGING STRATEGY (from active) — back button */}
      {/* ============================================ */}
      {showGenerate && (
        <button onClick={() => setShowGenerate(false)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to active strategy
        </button>
      )}

      {/* ============================================ */}
      {/* GENERATING                                   */}
      {/* ============================================ */}
      {(showGenerate || !policyActive) && generating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 space-y-6">
          <div className="flex items-center gap-4">
            <svg className="w-8 h-8 animate-spin text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div>
              <p className="text-gray-200 font-medium">Generating strategies via Venice AI</p>
              <p className="text-xs text-gray-500 mt-1">You can switch tabs — this keeps running in the background.</p>
            </div>
          </div>

          {/* Show what was sent to Venice */}
          <div className="bg-gray-800/40 rounded-lg p-4 space-y-2">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Analyzing</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-gray-400">Vault: {vaultData?.balances?.WETH || '0'} WETH, {vaultData?.balances?.USDC || '0'} USDC</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-gray-400">ETH: {rates?.prices?.eth ? `$${rates.prices.eth.toLocaleString()}` : 'loading...'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-gray-400">Lido APR: {rates?.lido ? `${rates.lido.smaApr.toFixed(2)}%` : 'loading...'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-gray-400">Protocols: Lido, Uniswap V3</span>
              </div>
            </div>
            <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              Sent privately to Venice AI — zero data retention
            </p>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* STRATEGY CARDS — pick one                    */}
      {/* ============================================ */}
      {(showGenerate || !policyActive) && strategies.length > 0 && (
        <div className="space-y-4">
          {/* Generate empty state for "change strategy" flow */}
          {showGenerate && strategies.length === 0 && !generating && (
            <div className="text-center py-8">
              <button onClick={generate} className="bg-indigo-600 hover:bg-indigo-600 px-8 py-3 rounded-lg font-medium transition">
                Generate New Strategies
              </button>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span>{generatedAt ? `Generated ${timeAgo(generatedAt)}` : 'Cached strategies'}</span>
              <div className="relative group">
                <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center cursor-help text-[10px] text-gray-500 hover:border-indigo-400 hover:text-yellow-400 transition">?</div>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 bg-gray-800 border border-gray-800 rounded-lg p-3 text-xs text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-xl">
                  Strategies cached in your browser only. Venice AI generates them with zero data retention.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-2 h-2 bg-gray-800 border-r border-b border-gray-800 rotate-45" />
                </div>
              </div>
            </div>
            <button onClick={generate} disabled={generating}
              className="text-gray-500 hover:text-gray-300 transition flex items-center gap-1">
              <svg className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {strategies.map((s, i) => (
            <div key={i} className="w-full text-left border rounded-xl p-6 transition border-gray-800 bg-gray-900 hover:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg">{s.name}</span>
                <span className="text-sm text-indigo-400 font-medium">{s.expectedYield}</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">{s.description}</p>
              <div className="space-y-2 mb-4">
                {s.steps?.map((step, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-indigo-400 mt-0.5 shrink-0">{j + 1}.</span>
                    <span className="text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3 border-t border-gray-800/50 mb-4">
                <div><span className="text-gray-600">Max trade: </span><span className="text-gray-400">{s.guardrails.maxTradeSize}</span></div>
                <div><span className="text-gray-600">Daily limit: </span><span className="text-gray-400">{s.guardrails.dailyLimit}</span></div>
                <div><span className="text-gray-600">Slippage: </span><span className="text-gray-400">{s.guardrails.maxSlippage}</span></div>
                <div><span className="text-gray-600">Protocols: </span><span className="text-gray-400">{s.guardrails.protocols.join(', ')}</span></div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                <span className="text-xs text-gray-600">Writes to <a href={`https://sepolia.basescan.org/address/${POLICY_CONTRACT}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline">{shortenAddr(POLICY_CONTRACT)}</a></span>
                <button onClick={() => deploy(s)}
                  className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg text-sm font-medium transition">
                  Approve &amp; Start Agent
                </button>
              </div>
            </div>
          ))}

          <button onClick={() => router.push(`/chat?strategy=${encodeURIComponent(JSON.stringify(strategies))}`)}
            className="w-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 rounded-xl p-5 transition flex items-center justify-center gap-3 group">
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-yellow-300 font-medium">Ask the DeFi Advisor about these strategies</span>
            <svg className="w-4 h-4 text-yellow-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Show generate button for change-strategy flow when no strategies loaded yet */}
      {showGenerate && strategies.length === 0 && !generating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center space-y-6">
          <h2 className="text-lg font-semibold">Generate new strategies</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Venice AI will analyze current market conditions and your vault to propose fresh strategies.
          </p>
          <button onClick={generate}
            className="bg-indigo-600 hover:bg-indigo-600 px-8 py-3 rounded-lg font-medium transition text-lg">
            Generate Strategies
          </button>
        </div>
      )}

      {/* How it works — compact */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-400">Private analysis, public trades.</strong> Venice AI generates strategies privately (zero data retention) — nobody sees your analysis, not even us. When you approve, the guardrails are written to the <a href={`https://sepolia.basescan.org/address/${POLICY_CONTRACT}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline">policy contract</a> on-chain. Your agent requests trades via the API — MoltFi executes them through the vault. Trades are blockchain transactions — public and verifiable by design.
        </p>
      </div>
    </div>
  )
}
