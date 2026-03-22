'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useWalletClient, useSwitchChain } from 'wagmi'
import { parseEther, encodeFunctionData } from 'viem'
import { baseSepolia } from 'viem/chains'
import { useRouter } from 'next/navigation'
import { useAgentContext } from '../components/AgentContext'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const POLICY_CONTRACT = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

const TOKENS: Record<string, { address: `0x${string}`; description: string }> = {
  WETH: { address: '0x4200000000000000000000000000000000000006', description: 'Wrapped ETH — the base trading pair' },
  USDC: { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', description: 'USD Coin — stablecoin pegged to $1' },
}

const factoryAbi = [
  { name: 'updatePolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }, { name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }], outputs: [] },
  { name: 'revokePolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }], outputs: [] },
  { name: 'approveToken', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }], outputs: [] },
  { name: 'removeToken', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }], outputs: [] },
] as const

type Strategy = {
  name: string; description: string; expectedYield: string
  steps: string[]
  guardrails: { maxTradeSize: string; dailyLimit: string; maxSlippage: string; protocols: string[] }
}

type ChatMessage = { role: 'user' | 'assistant'; content: string }

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

// ─── Main Strategy Page ───────────────────────────────────────
export default function StrategyPage() {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const { vaults, vaultData, rates, ethPrice, hasVault, refreshVaults } = useAgentContext()
  const router = useRouter()
  const fetchRef = useRef<AbortController | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const wrongNetwork = chainId !== baseSepolia.id

  // On-chain source of truth
  const policyActive = vaultData?.policy?.active === true
  const policyMaxPerAction = vaultData?.policy?.maxPerAction || '0'
  const policyDailyLimit = vaultData?.policy?.dailyLimit || '0'
  const policyDailySpent = vaultData?.policy?.dailySpent || '0'
  const policyRemaining = vaultData?.policy?.remaining || '0'

  // Strategy state
  const [cachedStrategy, setCachedStrategy] = useState<Strategy | null>(() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('ag_active_strategy') || 'null') } catch { return null }
  })
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [generating, setGenerating] = useState(false)

  // Chat state (advisor)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)

  // Guardrail adjustment
  const [showAdjust, setShowAdjust] = useState(false)
  const [editMax, setEditMax] = useState('')
  const [editDaily, setEditDaily] = useState('')
  const [deploying, setDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<string | null>(null)

  // Recent activity
  const [recentActivity, setRecentActivity] = useState<Activity[]>([])

  // TX state
  const [txStatus, setTxStatus] = useState('')
  const { writeContract, data: txHash } = useWriteContract()
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  // Load recent activity when policy is active
  useEffect(() => {
    if (!policyActive || !vaults[0]) return
    fetch(`/api/vault/activity?vault=${vaults[0]}`)
      .then(r => r.json())
      .then(d => setRecentActivity((d.activities || []).slice(0, 3)))
      .catch(() => {})
  }, [policyActive, vaults])

  // Init adjust fields from on-chain
  useEffect(() => {
    setEditMax(policyMaxPerAction)
    setEditDaily(policyDailyLimit)
  }, [policyMaxPerAction, policyDailyLimit])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ── Generate strategies ──
  const generate = useCallback(async () => {
    if (fetchRef.current) fetchRef.current.abort()
    const controller = new AbortController()
    fetchRef.current = controller
    setGenerating(true)
    setStrategies([])

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
        setStrategies(parsed)
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return
    }
    setGenerating(false)
  }, [vaultData, rates])

  // ── Deploy a strategy (sets guardrails on-chain) ──
  const deploy = (s: Strategy) => {
    if (!vaults[0]) return
    setTxStatus('Confirm in your wallet — writing guardrails to the policy contract...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'updatePolicy',
      args: [vaults[0] as `0x${string}`, parseEther(s.guardrails.maxTradeSize.replace(' ETH', '')),
        parseEther(s.guardrails.dailyLimit.replace(' ETH', ''))], chain: baseSepolia })
    setCachedStrategy(s)
    localStorage.setItem('ag_active_strategy', JSON.stringify(s))
  }

  // ── Pause agent (revoke policy) ──
  const pause = () => {
    if (!vaults[0]) return
    setTxStatus('Confirm in your wallet — revoking agent policy on-chain...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'revokePolicy',
      args: [vaults[0] as `0x${string}`], chain: baseSepolia })
    setCachedStrategy(null)
    localStorage.removeItem('ag_active_strategy')
  }

  // ── Save adjusted guardrails ──
  const saveAdjustments = async () => {
    if (!vaults[0] || !walletClient) return
    if (wrongNetwork) {
      try { await switchChain({ chainId: baseSepolia.id }); await new Promise(r => setTimeout(r, 500)) } catch { return }
    }
    setDeploying(true)
    setDeployStatus('Confirm trade limits update in your wallet...')
    try {
      // @ts-expect-error viem v2 strict types
      const hash = await walletClient.sendTransaction({
        to: VAULT_FACTORY,
        data: encodeFunctionData({
          abi: factoryAbi, functionName: 'updatePolicy',
          args: [vaults[0] as `0x${string}`, parseEther(editMax || '0'), parseEther(editDaily || '0')],
        }),
      })
      setDeployStatus('✓ Limits updated on-chain')
      refreshVaults()
      setTimeout(() => { setDeployStatus(null); setShowAdjust(false) }, 2000)
    } catch (err: any) {
      if (err.message?.includes('User rejected') || err.message?.includes('denied')) {
        setDeployStatus(null)
      } else {
        setDeployStatus(`Error: ${err.message?.slice(0, 80)}`)
        setTimeout(() => setDeployStatus(null), 4000)
      }
    }
    setDeploying(false)
  }

  // ── Chat with advisor ──
  const sendChat = async () => {
    const msg = chatInput.trim()
    if (!msg || chatLoading) return
    setChatInput('')
    const updated = [...chatMessages, { role: 'user' as const, content: msg }]
    setChatMessages(updated)
    setChatLoading(true)

    try {
      const systemContext = `User's vault: ${vaultData?.balances?.WETH || '0'} WETH, ${vaultData?.balances?.USDC || '0'} USDC.
ETH price: ${ethPrice ? `$${ethPrice.toLocaleString()}` : 'unknown'}. Lido APR: ${rates?.lido ? `${rates.lido.smaApr.toFixed(2)}%` : 'unknown'}.
Policy: ${policyActive ? `active, max ${policyMaxPerAction} ETH/trade, ${policyDailyLimit} ETH/day` : 'inactive'}.
${cachedStrategy ? `Current strategy: ${cachedStrategy.name} — ${cachedStrategy.description}` : 'No strategy selected.'}`

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemContext },
            ...updated.map(m => ({ role: m.role, content: m.content }))
          ]
        })
      })
      const data = await res.json()
      if (data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch {}
    setChatLoading(false)
  }

  // ── Guards ──
  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to view strategies.</div>
  if (!hasVault) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Create a vault first in the Vault tab.</div>

  const vaultAddr = vaults[0] || ''
  const limitsChanged = editMax !== policyMaxPerAction || editDaily !== policyDailyLimit

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

      <div>
        <h1 className="text-2xl font-bold">Strategy</h1>
        <p className="text-sm text-gray-500">Choose a strategy, set your limits, talk to the advisor</p>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ACTIVE STRATEGY                                     */}
      {/* ═══════════════════════════════════════════════════ */}
      {policyActive && (
        <div className="space-y-4">
          {/* Strategy + guardrails card */}
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

            {cachedStrategy && (
              <div className="mb-5">
                <p className="text-sm text-gray-300 mb-3">{cachedStrategy.description}</p>
                {cachedStrategy.steps?.length > 0 && (
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
            )}

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
                <div className="text-xs text-gray-500 mb-1">Remaining</div>
                <div className="text-gray-200 font-medium">{policyRemaining} ETH</div>
              </div>
            </div>

            {/* Adjust limits (expandable) */}
            {showAdjust && (
              <div className="bg-gray-800/30 border border-gray-800 rounded-lg p-5 mb-5 space-y-4">
                <div className="text-sm font-medium text-gray-300">Adjust Trade Limits</div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Max Per Trade</label>
                    <div className="relative">
                      <input type="number" step="0.1" min="0" value={editMax}
                        onChange={e => setEditMax(e.target.value)}
                        className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          editMax !== policyMaxPerAction ? 'border-indigo-500 text-white' : 'border-gray-800 text-gray-300'
                        }`} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">ETH</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Daily Volume Cap</label>
                    <div className="relative">
                      <input type="number" step="0.5" min="0" value={editDaily}
                        onChange={e => setEditDaily(e.target.value)}
                        className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          editDaily !== policyDailyLimit ? 'border-indigo-500 text-white' : 'border-gray-800 text-gray-300'
                        }`} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">ETH</span>
                    </div>
                  </div>
                </div>
                {limitsChanged && (
                  <div className="flex items-center gap-3">
                    <button onClick={saveAdjustments} disabled={deploying}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
                      {deploying ? 'Deploying...' : 'Save to Chain'}
                    </button>
                    <button onClick={() => { setEditMax(policyMaxPerAction); setEditDaily(policyDailyLimit) }}
                      className="text-sm text-gray-400 hover:text-white transition">Discard</button>
                    {deployStatus && <span className="text-sm text-indigo-300">{deployStatus}</span>}
                  </div>
                )}
                <p className="text-xs text-gray-600">Changes require a wallet transaction — the smart contract enforces these limits, not the agent.</p>
              </div>
            )}

            {/* Verifiable links */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 mb-5">
              <span>Vault: <a href={`https://sepolia.basescan.org/address/${vaultAddr}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">{shortenAddr(vaultAddr)}</a></span>
              <span>Policy: <a href={`https://sepolia.basescan.org/address/${POLICY_CONTRACT}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">{shortenAddr(POLICY_CONTRACT)}</a></span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
              <button onClick={() => setShowAdjust(!showAdjust)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium transition">
                {showAdjust ? 'Hide Limits' : 'Adjust Limits'}
              </button>
              <button onClick={() => { setStrategies([]); generate() }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2.5 rounded-lg text-sm font-medium transition">
                Change Strategy
              </button>
              <div className="ml-auto">
                <button onClick={pause}
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2.5 rounded-lg border border-red-500/30 transition text-sm font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Pause Agent
                </button>
              </div>
            </div>
          </div>

          {/* Recent activity preview */}
          {recentActivity.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-gray-300">Recent Activity</div>
                <button onClick={() => router.push('/activity')} className="text-xs text-indigo-400 hover:underline">View all →</button>
              </div>
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
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* NO ACTIVE STRATEGY — generate                      */}
      {/* ═══════════════════════════════════════════════════ */}
      {!policyActive && strategies.length === 0 && !generating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">No active strategy</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Your vault has funds but the agent can&apos;t trade until you approve a strategy. Each strategy comes with trade limits that are enforced by the smart contract — not the agent.
            </p>
          </div>
          <button onClick={generate}
            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg font-medium transition text-lg">
            Show Me Strategies
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* GENERATING                                          */}
      {/* ═══════════════════════════════════════════════════ */}
      {generating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <div className="flex items-center gap-4">
            <svg className="w-8 h-8 animate-spin text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <div>
              <p className="text-gray-200 font-medium">Analyzing your vault and market conditions...</p>
              <p className="text-xs text-gray-500 mt-1">
                {vaultData?.balances?.WETH || '0'} WETH · ETH {rates?.prices?.eth ? `$${rates.prices.eth.toLocaleString()}` : '...'} · Lido {rates?.lido ? `${rates.lido.smaApr.toFixed(2)}%` : '...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* STRATEGY CARDS                                      */}
      {/* ═══════════════════════════════════════════════════ */}
      {strategies.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>Choose a strategy — approving sets the trade limits on-chain</span>
            <button onClick={generate} disabled={generating}
              className="text-gray-500 hover:text-gray-300 transition flex items-center gap-1">
              <svg className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </button>
          </div>

          {strategies.map((s, i) => (
            <div key={i} className="border rounded-xl p-6 border-gray-800 bg-gray-900 hover:border-gray-700 transition">
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
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-3 border-t border-gray-800/50 mb-4">
                <span>Max trade: <strong className="text-gray-400">{s.guardrails.maxTradeSize}</strong></span>
                <span>Daily limit: <strong className="text-gray-400">{s.guardrails.dailyLimit}</strong></span>
                <span>Slippage: <strong className="text-gray-400">{s.guardrails.maxSlippage}</strong></span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                <span className="text-xs text-gray-600">Sets guardrails on <a href={`https://sepolia.basescan.org/address/${POLICY_CONTRACT}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline">{shortenAddr(POLICY_CONTRACT)}</a></span>
                <button onClick={() => deploy(s)}
                  className="bg-green-600 hover:bg-green-500 px-5 py-2 rounded-lg text-sm font-medium transition">
                  Approve &amp; Start Agent
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* ADVISOR CHAT                                        */}
      {/* ═══════════════════════════════════════════════════ */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <button onClick={() => setShowChat(!showChat)}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-800/30 transition">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="font-medium text-gray-300">Ask the DeFi Advisor</span>
          </div>
          <svg className={`w-5 h-5 text-gray-600 transition-transform ${showChat ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showChat && (
          <div className="border-t border-gray-800">
            {/* Messages */}
            <div className="max-h-80 overflow-y-auto p-5 space-y-4">
              {chatMessages.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Ask anything about your vault, strategies, or DeFi on Base.
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-300'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-500">Thinking...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-800 p-4">
              <div className="flex gap-2">
                <input type="text" value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
                  placeholder="e.g. Should I stake more ETH right now?"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
                <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
                  Send
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">Powered by Venice AI — zero data retention on strategy analysis</p>
            </div>
          </div>
        )}
      </div>

      {/* How it works — compact footer */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          <strong className="text-gray-400">How it works:</strong> Venice AI generates strategies based on your vault and market data (zero data retention — your analysis is never saved). When you approve, the trade limits are written to the <a href={`https://sepolia.basescan.org/address/${POLICY_CONTRACT}`} target="_blank" rel="noopener" className="text-indigo-400 hover:underline">policy contract</a> on Base. The agent trades within those limits — the smart contract enforces them, not the agent.
        </p>
      </div>
    </div>
  )
}
