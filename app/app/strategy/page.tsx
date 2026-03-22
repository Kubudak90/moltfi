'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { useRouter } from 'next/navigation'
import { useAgentContext } from '../components/AgentContext'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const

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

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function StrategyPage() {
  const { address } = useAccount()
  const { vaults, vaultData, rates, hasVault } = useAgentContext()
  const router = useRouter()
  const fetchRef = useRef<AbortController | null>(null)

  // Load cached state from localStorage
  const [strategies, setStrategies] = useState<Strategy[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('ag_strategies') || '[]') } catch { return [] }
  })
  const [generatedAt, setGeneratedAt] = useState<number>(() => {
    if (typeof window === 'undefined') return 0
    return parseInt(localStorage.getItem('ag_strategies_ts') || '0')
  })
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [active, setActive] = useState<Strategy | null>(() => {
    if (typeof window === 'undefined') return null
    try { return JSON.parse(localStorage.getItem('ag_active_strategy') || 'null') } catch { return null }
  })
  const [txStatus, setTxStatus] = useState('')

  const { writeContract, data: txHash } = useWriteContract()
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  // Check if a generation was in progress when we mounted (tab switch recovery)
  useEffect(() => {
    const inProgress = localStorage.getItem('ag_generating')
    if (inProgress === 'true' && strategies.length === 0) {
      // Generation was interrupted by tab switch — auto-restart
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
    setSelected(null)
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
          content: `You are an autonomous AI DeFi agent for AgentGuard on Base. The user has a vault with ${balance} WETH and ${usdcBalance} USDC. Current data: ETH price ${ep}, Lido stETH APR ${lidoApr}.

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
      if (e.name === 'AbortError') return // tab switch, don't clear generating flag
    }
    setGenerating(false)
    localStorage.removeItem('ag_generating')
  }, [vaultData, rates])

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => { fetchRef.current?.abort() }
  }, [])

  const deploy = (s: Strategy) => {
    if (!vaults[0]) return
    setTxStatus('Setting guardrails on-chain...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'updatePolicy',
      args: [vaults[0] as `0x${string}`, parseEther(s.guardrails.maxTradeSize.replace(' ETH', '')),
        parseEther(s.guardrails.dailyLimit.replace(' ETH', ''))], chain: baseSepolia })
    setActive(s)
    localStorage.setItem('ag_active_strategy', JSON.stringify(s))
  }

  const pause = () => {
    if (!vaults[0]) return
    setTxStatus('Pausing agent...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'revokePolicy',
      args: [vaults[0] as `0x${string}`], chain: baseSepolia })
    setActive(null)
    localStorage.removeItem('ag_active_strategy')
  }

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to view strategies.</div>
  if (!hasVault) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Create a vault first in the Vault tab.</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {txStatus && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-sm text-indigo-300">
          {txConfirmed ? '✓ Confirmed!' : txStatus}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategy</h1>
          <p className="text-sm text-gray-500">Approve a strategy — your agent runs autonomously within on-chain guardrails</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-purple-400">
          <div className="w-2 h-2 rounded-full bg-purple-400" />Venice AI
        </div>
      </div>

      {/* Active strategy */}
      {active && (
        <div className="p-6 bg-green-500/5 border border-green-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold text-green-400">Agent Running</span>
            </div>
            <span className="text-xs text-green-300/70">{active.expectedYield}</span>
          </div>
          <div className="font-medium text-lg mb-1">{active.name}</div>
          <p className="text-sm text-gray-400 mb-4">{active.description}</p>
          <div className="bg-gray-800/40 rounded-lg p-4 mb-4">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">What the agent is doing</div>
            {active.steps?.map((step, j) => (
              <div key={j} className="flex items-start gap-2 text-sm mb-1.5">
                <span className="text-green-400 shrink-0">→</span>
                <span className="text-gray-300">{step}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-4">
            <div className="bg-gray-800/50 rounded-lg p-2"><span className="text-gray-500">Max trade: </span><span className="text-gray-300">{active.guardrails.maxTradeSize}</span></div>
            <div className="bg-gray-800/50 rounded-lg p-2"><span className="text-gray-500">Daily limit: </span><span className="text-gray-300">{active.guardrails.dailyLimit}</span></div>
            <div className="bg-gray-800/50 rounded-lg p-2"><span className="text-gray-500">Slippage: </span><span className="text-gray-300">{active.guardrails.maxSlippage}</span></div>
            <div className="bg-gray-800/50 rounded-lg p-2"><span className="text-gray-500">Protocols: </span><span className="text-gray-300">{active.guardrails.protocols.join(', ')}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setActive(null); setStrategies([]); setSelected(null); localStorage.removeItem('ag_active_strategy'); localStorage.removeItem('ag_strategies'); localStorage.removeItem('ag_strategies_ts') }}
              className="text-sm text-gray-500 hover:text-gray-300">Change Strategy</button>
            <button onClick={pause}
              className="ml-auto bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 transition text-sm font-medium">
              Pause Agent
            </button>
          </div>
        </div>
      )}

      {/* Empty state — no strategies yet */}
      {!active && strategies.length === 0 && !generating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
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

          {/* Privacy callout */}
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-medium text-purple-300 mb-1">Private by design</div>
                <p className="text-xs text-gray-500">
                  Strategies are generated fresh each time using Venice AI with <strong className="text-gray-400">zero data retention</strong>. Your financial data is never stored — not by us, not by Venice. That&apos;s why you click the button each visit.
                </p>
              </div>
            </div>
          </div>

          <button onClick={generate}
            className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg font-medium transition text-lg">
            Show Me Strategies
          </button>
        </div>
      )}

      {/* Generating state */}
      {!active && generating && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center space-y-4">
          <div className="flex justify-center">
            <svg className="w-10 h-10 animate-spin text-indigo-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <div>
            <p className="text-gray-300 font-medium">Analyzing protocols, yields, and market conditions</p>
            <p className="text-sm text-gray-500 mt-1">Venice AI is reviewing your vault — this takes a few seconds.</p>
            <p className="text-xs text-gray-600 mt-3">You can switch tabs — strategies will be ready when you come back.</p>
          </div>
        </div>
      )}

      {/* Strategy cards */}
      {!active && strategies.length > 0 && (
        <div className="space-y-4">
          {/* Generated timestamp */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              {generatedAt ? `Generated ${timeAgo(generatedAt)}` : 'Cached strategies'}
            </span>
            <button onClick={generate} disabled={generating}
              className="text-gray-500 hover:text-gray-300 transition flex items-center gap-1">
              <svg className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {strategies.map((s, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`w-full text-left border rounded-xl p-6 transition ${selected === i ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 hover:border-gray-700 bg-gray-900'}`}>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3 border-t border-gray-800/50">
                <div><span className="text-gray-600">Max trade: </span><span className="text-gray-400">{s.guardrails.maxTradeSize}</span></div>
                <div><span className="text-gray-600">Daily limit: </span><span className="text-gray-400">{s.guardrails.dailyLimit}</span></div>
                <div><span className="text-gray-600">Slippage: </span><span className="text-gray-400">{s.guardrails.maxSlippage}</span></div>
                <div><span className="text-gray-600">Protocols: </span><span className="text-gray-400">{s.guardrails.protocols.join(', ')}</span></div>
              </div>
              {selected === i && (
                <div className="mt-4 pt-4 border-t border-indigo-500/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-indigo-300">Guardrails enforced on-chain via smart contract</span>
                    <div className="flex gap-2">
                      <div onClick={(e) => { e.stopPropagation(); router.push(`/chat?strategy=${encodeURIComponent(JSON.stringify(s))}`) }}
                        className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-4 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer border border-purple-500/30 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        Chat About This
                      </div>
                      <div onClick={(e) => { e.stopPropagation(); deploy(s) }}
                        className="bg-green-600 hover:bg-green-500 px-6 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer">
                        Approve &amp; Start Agent
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* How strategies work */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold mb-3">How Strategies Work</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            <span><strong className="text-gray-300">AI analyzes markets</strong> — Venice AI checks current ETH price, Lido staking yields, gas costs, and your vault balance. Analysis is private — zero data retention.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">2.</span>
            <span><strong className="text-gray-300">AI proposes strategies with guardrails</strong> — each strategy comes with built-in limits (max trade size, daily cap). You don&apos;t need to configure anything technical.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">3.</span>
            <span><strong className="text-gray-300">You pick one</strong> — &quot;Approve &amp; Start Agent&quot; writes the guardrails to a smart contract on Base. These limits are now on-chain.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">4.</span>
            <span><strong className="text-gray-300">Agent runs autonomously</strong> — it checks markets every 30 minutes, rebalances, and trades within your guardrails. If it tries to exceed them, the blockchain reverts the transaction.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">5.</span>
            <span><strong className="text-gray-300">Pause anytime</strong> — one click revokes the agent&apos;s policy on-chain. It can&apos;t trade until you re-enable it.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
