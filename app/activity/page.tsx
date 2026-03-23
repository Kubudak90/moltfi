'use client'

import { useEffect, useState } from 'react'
import { useAgentContext } from '../components/AgentContext'

type Activity = {
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

const TYPE_STYLE: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  deposit: { icon: '↓', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  swap: { icon: '↔', color: 'text-blue-400', bg: 'bg-blue-600/10', border: 'border-blue-500/20' },
  stake: { icon: '⬆', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  withdraw: { icon: '↑', color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-500/20' },
  yield: { icon: '◉', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
}

function formatTime(ts: number | null): string {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const now = Date.now()
  const diff = Math.floor((now - d.getTime()) / 1000)
  const timeStr = d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  if (diff < 60) return `Just now · ${timeStr}`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago · ${timeStr}`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago · ${timeStr}`
  return `${Math.floor(diff / 86400)}d ago · ${timeStr}`
}

export default function ActivityPage() {
  const { vaults, hasVault } = useAgentContext()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (!hasVault || !vaults[0]) { setLoading(false); return }
    fetch(`/api/vault/activity?vault=${vaults[0]}`)
      .then(r => r.json())
      .then(d => { setActivities(d.activities || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [vaults, hasVault])

  if (!hasVault) {
    return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Create a vault first to see activity.</div>
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-sm text-gray-500">On-chain transactions from your vault</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500">{activities.length} transaction{activities.length !== 1 ? 's' : ''}</div>
          <a href={`https://sepolia.basescan.org/address/${vaults[0]}`} target="_blank" rel="noopener"
            className="text-xs text-blue-400 hover:underline">Raw blockchain data →</a>
        </div>
      </div>

      {loading && <div className="text-center py-12 text-gray-500">Reading from blockchain...</div>}

      {!loading && activities.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-gray-400 font-medium mb-1">No activity yet</div>
          <p className="text-xs text-gray-600">When your agent makes trades, stakes, or deposits, every action shows up here with a plain-English explanation of what happened and whether guardrails were followed.</p>
        </div>
      )}

      {activities.length > 0 && (
        <div className="space-y-3">
          {activities.map((tx) => {
            const style = TYPE_STYLE[tx.type] || TYPE_STYLE.deposit
            const isExpanded = expanded === tx.txHash
            return (
              <div key={tx.txHash}
                className={`bg-gray-900 border ${style.border} rounded-xl overflow-hidden transition-all`}>
                {/* Main row — always visible */}
                <button onClick={() => setExpanded(isExpanded ? null : tx.txHash)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-800/30 transition">
                  <div className={`w-10 h-10 rounded-full ${style.bg} flex items-center justify-center shrink-0`}>
                    <span className={`text-lg ${style.color}`}>{style.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${style.color}`}>{tx.summary}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{formatTime(tx.timestamp)}</div>
                  </div>
                  <svg className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 space-y-3 border-t border-gray-800">
                    <div className="pt-4">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
                        {tx.aiGenerated ? (
                          <>Venice AI Summary <span className="text-blue-400 normal-case tracking-normal">(generated by agent)</span></>
                        ) : (
                          'What happened'
                        )}
                      </div>
                      <p className="text-sm text-gray-300">{tx.detail}</p>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Guardrail check</div>
                      <p className="text-sm text-gray-300">{tx.guardrailCheck}</p>
                    </div>

                    {/* Proof breakdown */}
                    {tx.proof && (
                      <div>
                        <a href={`https://sepolia.basescan.org/tx/${tx.txHash}`} target="_blank" rel="noopener"
                          className="text-xs text-blue-400 uppercase tracking-wider mb-2 inline-flex items-center gap-1 hover:underline">
                          On-chain proof
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </a>
                        <div className="bg-gray-800/50 rounded-lg divide-y divide-gray-700/50">
                          {Object.entries(tx.proof).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between px-3 py-2 text-xs">
                              <span className="text-gray-500">{key}</span>
                              <span className={`font-mono ${
                                val.includes('✓') || val.includes('passed') ? 'text-green-400' :
                                (val as string).startsWith('0x') ? 'text-blue-400' : 'text-gray-300'
                              }`}>
                                {(val as string).startsWith('0x') ? (
                                  <a href={`https://sepolia.basescan.org/address/${val}`} target="_blank" rel="noopener" className="hover:underline">
                                    {(val as string).slice(0, 6)}...{(val as string).slice(-4)}
                                  </a>
                                ) : val}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <div className="text-xs text-gray-500">Transaction</div>
                        <span className="text-xs font-mono text-gray-400">{tx.txHash.slice(0, 20)}...{tx.txHash.slice(-8)}</span>
                      </div>
                      <a href={`https://sepolia.basescan.org/tx/${tx.txHash}`} target="_blank" rel="noopener"
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-blue-400 px-3 py-1.5 rounded-lg transition">
                        Verify on Basescan →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}


    </div>
  )
}
