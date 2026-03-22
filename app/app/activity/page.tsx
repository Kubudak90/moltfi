'use client'

import { useEffect, useState } from 'react'
import { useAgentContext } from '../components/AgentContext'

type Activity = {
  type: 'deposit' | 'swap' | 'stake' | 'withdraw' | 'create' | 'unknown'
  hash: string
  from: string
  to: string
  value: string
  timestamp: string
  blockNumber: string
  functionName?: string
}

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  deposit: { label: 'Deposit', icon: '↓', color: 'text-green-400', bg: 'bg-green-500/20' },
  swap: { label: 'Swap', icon: '↔', color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  stake: { label: 'Stake', icon: '⬆', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  withdraw: { label: 'Withdraw', icon: '↑', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  create: { label: 'Vault Created', icon: '✦', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  unknown: { label: 'Transaction', icon: '•', color: 'text-gray-400', bg: 'bg-gray-500/20' },
}

function classifyTx(tx: any): Activity['type'] {
  const input = tx.input || ''
  const fn = tx.functionName || ''
  if (fn.includes('depositETH') || input.startsWith('0xf6326fb3')) return 'deposit'
  if (fn.includes('swap') || fn.includes('executeSwap') || input.startsWith('0x12aa3caf')) return 'swap'
  if (fn.includes('stake') || fn.includes('submit')) return 'stake'
  if (fn.includes('withdraw')) return 'withdraw'
  if (fn.includes('createVault')) return 'create'
  // If sending ETH to the vault with no data, it's a deposit
  if (input === '0x' && parseFloat(tx.value) > 0) return 'deposit'
  return 'unknown'
}

function timeAgo(timestamp: string): string {
  const seconds = Math.floor((Date.now() / 1000) - parseInt(timestamp))
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function ActivityPage() {
  const { vaults, hasVault } = useAgentContext()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasVault || !vaults[0]) { setLoading(false); return }

    const vault = vaults[0]
    // Fetch transactions from Basescan API
    const url = `https://api-sepolia.basescan.org/api?module=account&action=txlist&address=${vault}&startblock=0&endblock=99999999&page=1&offset=50&sort=desc`

    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.status === '1' && data.result) {
          const txs: Activity[] = data.result.map((tx: any) => ({
            type: classifyTx(tx),
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: (parseFloat(tx.value) / 1e18).toFixed(6),
            timestamp: tx.timeStamp,
            blockNumber: tx.blockNumber,
            functionName: tx.functionName || '',
          }))
          setActivities(txs)
        }
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [vaults, hasVault])

  if (!hasVault) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">
        Create a vault first to see activity.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity</h1>
          <p className="text-sm text-gray-500">Every action on your vault, pulled from the blockchain</p>
        </div>
        <a href={`https://sepolia.basescan.org/address/${vaults[0]}`} target="_blank" rel="noopener"
          className="text-xs text-indigo-400 hover:underline">Full history on Basescan →</a>
      </div>

      {loading && (
        <div className="text-center py-12 text-gray-500">Loading transactions...</div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300">{error}</div>
      )}

      {!loading && activities.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <div className="text-gray-500 mb-2">No activity yet</div>
          <p className="text-xs text-gray-600">Deposit ETH into your vault to get started. Transactions will appear here automatically.</p>
        </div>
      )}

      {activities.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
          {activities.map((tx) => {
            const config = TYPE_CONFIG[tx.type]
            return (
              <a key={tx.hash} href={`https://sepolia.basescan.org/tx/${tx.hash}`} target="_blank" rel="noopener"
                className="flex items-center gap-4 p-4 hover:bg-gray-800/50 transition group">
                <div className={`w-10 h-10 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                  <span className={`text-lg ${config.color}`}>{config.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${config.color}`}>{config.label}</span>
                    {tx.functionName && (
                      <span className="text-xs text-gray-600 font-mono truncate">{tx.functionName.split('(')[0]}</span>
                    )}
                  </div>
                  {parseFloat(tx.value) > 0 && (
                    <div className="text-sm text-gray-400">{tx.value} ETH</div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500">{timeAgo(tx.timestamp)}</div>
                  <div className="text-xs text-gray-600 font-mono group-hover:text-indigo-400 transition">
                    {tx.hash.slice(0, 6)}...{tx.hash.slice(-4)}
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}

      {/* How it works */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold mb-3">How Activity Tracking Works</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            <span><strong className="text-gray-300">Every action is on-chain</strong> — deposits, swaps, stakes, and withdrawals are all blockchain transactions on Base.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">2.</span>
            <span><strong className="text-gray-300">Pulled live from Basescan</strong> — this page reads your vault&apos;s transaction history directly. Nothing is cached or simulated.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">3.</span>
            <span><strong className="text-gray-300">Click any row</strong> to see the full transaction details on Basescan — gas, block, input data, everything.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
