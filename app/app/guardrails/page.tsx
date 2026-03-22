'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useAgentContext } from '../components/AgentContext'

const POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

export default function GuardrailsPage() {
  const { address } = useAccount()
  const { vaults, vaultData, hasVault } = useAgentContext()
  const [privateMode, setPrivateMode] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Load private mode status
  useEffect(() => {
    if (!vaults[0]) return
    fetch(`/api/vault/private-mode?vault=${vaults[0]}`)
      .then(r => r.json())
      .then(d => { setPrivateMode(d.privateMode); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [vaults])

  const togglePrivateMode = async () => {
    if (!vaults[0]) return
    setToggling(true)
    try {
      const res = await fetch('/api/vault/private-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vault: vaults[0], enabled: !privateMode }),
      })
      const data = await res.json()
      setPrivateMode(data.privateMode)
    } catch {}
    setToggling(false)
  }

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to view guardrails.</div>
  if (!hasVault) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Create a vault first in the Vault tab.</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guardrails</h1>
          <p className="text-sm text-gray-500">On-chain limits and privacy controls for your vault</p>
        </div>
        <a href={`https://sepolia.basescan.org/address/${POLICY}`} target="_blank" rel="noopener"
          className="text-sm text-indigo-400 hover:underline">View Contract →</a>
      </div>

      {/* Private Mode Toggle */}
      <div className={`rounded-xl p-6 border transition ${privateMode ? 'bg-purple-500/5 border-purple-500/30' : 'bg-gray-900 border-gray-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <svg className={`w-6 h-6 ${privateMode ? 'text-purple-400' : 'text-gray-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold">Private Mode</h2>
              <p className="text-xs text-gray-500">Force all AI inference through Venice (zero data retention)</p>
            </div>
          </div>
          <button
            onClick={togglePrivateMode}
            disabled={toggling || !loaded}
            className={`relative w-14 h-7 rounded-full transition-colors ${privateMode ? 'bg-purple-600' : 'bg-gray-700'} ${toggling ? 'opacity-50' : ''}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${privateMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {privateMode ? (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-purple-300">
              <span className="text-green-400">✓</span>
              <span>Strategy generation routed through Venice AI only</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <span className="text-green-400">✓</span>
              <span>Zero data retention — your financial data is never stored</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <span className="text-green-400">✓</span>
              <span>Agent API calls must use the Venice pipeline endpoint</span>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Model: <span className="font-mono text-gray-400">llama-3.3-70b</span> via Venice AI
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            When disabled, your agent can use any AI provider for strategy analysis. Enable Private Mode to enforce Venice-only inference — your vault data stays private.
          </p>
        )}
      </div>

      {/* Spending Guardrails */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Spending Limits</h2>
        <p className="text-xs text-gray-500 mb-4">Set when you approve a strategy. Enforced by smart contract — your agent cannot exceed these.</p>
        {vaultData?.policy ? (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Max Per Trade</div>
                <div className="text-xl font-bold">{vaultData.policy.maxPerAction} ETH</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Daily Limit</div>
                <div className="text-xl font-bold">{vaultData.policy.dailyLimit} ETH</div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Today&apos;s usage</span>
                <span>{vaultData.policy.dailySpent} / {vaultData.policy.dailyLimit} ETH</span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{
                  width: `${Math.min(parseFloat(vaultData.policy.dailySpent) / parseFloat(vaultData.policy.dailyLimit) * 100 || 0, 100)}%`
                }} />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No active limits. Approve a strategy to set them.</p>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">How Enforcement Works</h2>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            <span>When you approve a strategy, the guardrails are written to a smart contract on Base.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">2.</span>
            <span>Every trade your agent makes goes through the AgentGuardRouter, which checks the guardrails before executing.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">3.</span>
            <span>If a trade would exceed any limit, the smart contract reverts it — the agent physically cannot break the rules.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">4.</span>
            <span>Only YOU (the vault owner) can change guardrails or pause the agent.</span>
          </div>
        </div>
      </div>

      {/* Approved Tokens */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Approved Tokens</h2>
        <div className="flex gap-3">
          {['WETH', 'USDC', 'wstETH'].map(token => (
            <div key={token} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium">
              {token}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">Your agent can only interact with these tokens. Adding new tokens requires a contract update from the vault owner.</p>
      </div>

      {/* On-chain vs Off-chain */}
      <div className="bg-gray-900 border border-indigo-500/20 rounded-xl p-6">
        <h3 className="font-semibold mb-3">Why On-Chain Guardrails Matter</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <div className="font-medium text-gray-300 mb-1">Off-chain guardrails (how others do it)</div>
            <ul className="space-y-1 text-xs">
              <li>• Limits checked in the agent&apos;s own code</li>
              <li>• A prompt injection or bug can bypass them</li>
              <li>• No way for the user to verify enforcement</li>
              <li>• Agent could modify its own limits</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-indigo-400 mb-1">On-chain guardrails (AgentGuard)</div>
            <ul className="space-y-1 text-xs">
              <li>• Limits enforced by smart contract on Base</li>
              <li>• Agent can&apos;t bypass — code is immutable on-chain</li>
              <li>• Anyone can verify by reading the contract</li>
              <li>• Only the human wallet can change limits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
