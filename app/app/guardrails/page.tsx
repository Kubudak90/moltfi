'use client'

import { useAgentContext } from '../components/AgentContext'
import { useState } from 'react'

export default function GuardrailsPage() {
  const { vaults, vaultData, hasVault } = useAgentContext()
  const [maxPerTrade, setMaxPerTrade] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  if (!hasVault) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">
        Create a vault first to configure guardrails.
      </div>
    )
  }

  const policy = vaultData?.policy
  const vault = vaults[0] as string

  const updatePolicy = async () => {
    setSaving(true)
    setResult(null)
    try {
      const res = await fetch('/api/vault/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vault,
          maxPerAction: maxPerTrade || policy?.maxPerAction || '0.5',
          dailyLimit: dailyLimit || policy?.dailyLimit || '1',
        }),
      })
      const data = await res.json()
      if (data.txHash) {
        setResult(`Updated on-chain — ${data.txHash.slice(0, 14)}…`)
        setMaxPerTrade('')
        setDailyLimit('')
      } else {
        setResult(data.error || 'Failed to update')
      }
    } catch (e: any) {
      setResult(e.message)
    }
    setSaving(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guardrails</h1>
        <a href={`https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc#readContract`}
          target="_blank" rel="noopener"
          className="text-xs text-indigo-400 hover:underline">View contract →</a>
      </div>

      {policy?.active ? (
        <>
          {/* Current limits */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-xs text-gray-500 mb-2">Max per trade</div>
              <div className="text-3xl font-bold">{policy.maxPerAction} ETH</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-xs text-gray-500 mb-2">Daily limit</div>
              <div className="text-3xl font-bold">{policy.dailyLimit} ETH</div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{policy.dailySpent} ETH used</span>
                  <span>{policy.remaining} ETH left</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (parseFloat(policy.dailySpent) / parseFloat(policy.dailyLimit)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Change limits */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="font-medium">Update limits</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max per trade (ETH)</label>
                <input type="number" step="0.01" min="0"
                  value={maxPerTrade} onChange={e => setMaxPerTrade(e.target.value)}
                  placeholder={policy.maxPerAction}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Daily limit (ETH)</label>
                <input type="number" step="0.1" min="0"
                  value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}
                  placeholder={policy.dailyLimit}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={updatePolicy} disabled={saving || (!maxPerTrade && !dailyLimit)}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg transition">
                {saving ? 'Writing to chain...' : 'Update on-chain'}
              </button>
              {result && <span className="text-xs text-gray-400">{result}</span>}
            </div>
            <p className="text-xs text-gray-600">This writes directly to the AgentPolicy smart contract. Changes take effect on the next trade.</p>
          </div>

          {/* Contracts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-400">Contracts</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'AgentPolicy', addr: '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' },
                { label: 'AgentGuardRouter', addr: '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' },
                { label: 'Vault', addr: vault },
              ].map(c => (
                <div key={c.addr} className="flex items-center justify-between">
                  <span className="text-gray-500">{c.label}</span>
                  <a href={`https://sepolia.basescan.org/address/${c.addr}`} target="_blank" rel="noopener"
                    className="font-mono text-indigo-400 hover:underline">{c.addr.slice(0, 6)}...{c.addr.slice(-4)}</a>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-6 space-y-4">
          <div className="text-lg font-medium text-yellow-400">No guardrails set</div>
          <p className="text-sm text-gray-500">Your agent cannot trade until limits are configured.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Max per trade (ETH)</label>
              <input type="number" step="0.01" min="0"
                value={maxPerTrade} onChange={e => setMaxPerTrade(e.target.value)}
                placeholder="0.5"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Daily limit (ETH)</label>
              <input type="number" step="0.1" min="0"
                value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}
                placeholder="1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
            </div>
          </div>
          <button onClick={updatePolicy} disabled={saving || (!maxPerTrade && !dailyLimit)}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition">
            {saving ? 'Writing to chain...' : 'Set guardrails'}
          </button>
        </div>
      )}
    </div>
  )
}
