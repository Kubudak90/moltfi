'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { useAgentContext } from '../components/AgentContext'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

const factoryAbi = [
  { name: 'updatePolicy', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'vault', type: 'address' }, { name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }], outputs: [] },
  { name: 'revokePolicy', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'vault', type: 'address' }], outputs: [] },
] as const

export default function GuardrailsPage() {
  const { address } = useAccount()
  const { vaults, vaultData, hasVault, refreshVaults } = useAgentContext()
  const [privateMode, setPrivateMode] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [newMaxTrade, setNewMaxTrade] = useState('')
  const [newDailyLimit, setNewDailyLimit] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  // Load private mode status
  useEffect(() => {
    if (!vaults[0]) return
    fetch(`/api/vault/private-mode?vault=${vaults[0]}`)
      .then(r => r.json())
      .then(d => { setPrivateMode(d.privateMode); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [vaults])

  // Refresh after TX confirms
  useEffect(() => {
    if (isSuccess) {
      setEditing(false)
      refreshVaults()
    }
  }, [isSuccess])

  // Pre-fill edit fields when vaultData loads
  useEffect(() => {
    if (vaultData?.policy) {
      setNewMaxTrade(vaultData.policy.maxPerAction)
      setNewDailyLimit(vaultData.policy.dailyLimit)
    }
  }, [vaultData])

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

  const updatePolicy = () => {
    if (!vaults[0]) return
    writeContract({
      address: VAULT_FACTORY,
      abi: factoryAbi,
      functionName: 'updatePolicy',
      args: [vaults[0] as `0x${string}`, parseEther(newMaxTrade), parseEther(newDailyLimit)],
    })
  }

  const revokePolicy = () => {
    if (!vaults[0] || !confirm('This will immediately stop your agent from making any trades. Continue?')) return
    writeContract({
      address: VAULT_FACTORY,
      abi: factoryAbi,
      functionName: 'revokePolicy',
      args: [vaults[0] as `0x${string}`],
    })
  }

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to view guardrails.</div>
  if (!hasVault) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Create a vault first in the Vault tab.</div>

  const policy = vaultData?.policy
  const policyActive = policy?.active
  const dailyUsagePercent = policy ? Math.min(parseFloat(policy.dailySpent) / parseFloat(policy.dailyLimit) * 100 || 0, 100) : 0
  const usageColor = dailyUsagePercent > 80 ? 'bg-red-500' : dailyUsagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'

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

      {/* Status Banner */}
      {policyActive ? (
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-xl px-5 py-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-green-300 font-medium">Agent is active — trading within your limits</span>
        </div>
      ) : policy ? (
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl px-5 py-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="text-sm text-red-300 font-medium">Agent is paused — policy revoked, no trades allowed</span>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-5 py-3">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <span className="text-sm text-yellow-300 font-medium">No guardrails set yet — approve a strategy to activate your agent</span>
        </div>
      )}

      {/* ── ACTIVE GUARDRAILS (on-chain) ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">Trading Limits</h2>
          <span className="text-xs text-gray-600 font-mono">On-chain · AgentPolicy.sol</span>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          {policyActive
            ? 'These limits are enforced by a smart contract. Your agent cannot exceed them — trades that break these rules are automatically reverted on-chain.'
            : 'No active policy. When you approve a strategy, these guardrails are written to the blockchain.'}
        </p>

        {policy ? (
          <div className="space-y-5">
            {/* Current values */}
            {!editing ? (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className={`rounded-lg p-4 ${policyActive ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-800/30 border border-gray-800'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Max Per Trade</span>
                      {policyActive && <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">ENFORCED</span>}
                    </div>
                    <div className="text-xl font-bold">{policy.maxPerAction} ETH</div>
                    <p className="text-[11px] text-gray-600 mt-1">Any single swap above this amount will be reverted</p>
                  </div>
                  <div className={`rounded-lg p-4 ${policyActive ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-800/30 border border-gray-800'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Daily Volume Cap</span>
                      {policyActive && <span className="text-[10px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded">ENFORCED</span>}
                    </div>
                    <div className="text-xl font-bold">{policy.dailyLimit} ETH</div>
                    <p className="text-[11px] text-gray-600 mt-1">Total volume across all trades in a 24h period</p>
                  </div>
                </div>

                {/* Daily usage */}
                {policyActive && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">Today&apos;s usage</span>
                      <span className="text-gray-400 font-mono text-xs">{policy.dailySpent} / {policy.dailyLimit} ETH</span>
                    </div>
                    <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                      <div className={`h-full ${usageColor} rounded-full transition-all`} style={{ width: `${dailyUsagePercent}%` }} />
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1">Remaining today: {policy.remaining} ETH · Resets daily on-chain</p>
                  </div>
                )}

                {/* Edit / Revoke buttons */}
                {policyActive && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition">
                      Change Limits
                    </button>
                    <button onClick={revokePolicy} disabled={isPending || isConfirming}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm rounded-lg border border-red-500/20 transition disabled:opacity-50">
                      {isPending || isConfirming ? 'Confirming...' : 'Emergency Stop'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Edit mode */
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Max Per Trade (ETH)</label>
                    <input type="number" step="0.1" min="0" value={newMaxTrade} onChange={e => setNewMaxTrade(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Daily Volume Cap (ETH)</label>
                    <input type="number" step="0.1" min="0" value={newDailyLimit} onChange={e => setNewDailyLimit(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-indigo-500 focus:outline-none" />
                  </div>
                </div>
                <p className="text-xs text-gray-600">This will send a transaction to update the AgentPolicy contract. Only you (the vault owner) can do this.</p>
                <div className="flex gap-3">
                  <button onClick={updatePolicy} disabled={isPending || isConfirming || !newMaxTrade || !newDailyLimit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition disabled:opacity-50">
                    {isPending ? 'Confirm in wallet...' : isConfirming ? 'Writing to chain...' : 'Update On-Chain'}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm rounded-lg transition">
                    Cancel
                  </button>
                </div>
                {isSuccess && <p className="text-sm text-green-400">✓ Guardrails updated on-chain</p>}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/30 rounded-lg p-6 text-center">
            <p className="text-sm text-gray-500">No trading limits set yet.</p>
            <p className="text-xs text-gray-600 mt-1">Go to the Strategy tab → generate strategies → approve one. The guardrails from that strategy will be written here.</p>
          </div>
        )}
      </div>

      {/* ── APPROVED TOKENS (on-chain) ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold">Approved Tokens</h2>
          <span className="text-xs text-gray-600 font-mono">On-chain · AgentPolicy.sol</span>
        </div>
        <p className="text-xs text-gray-500 mb-4">Your agent can only trade these tokens. Any swap involving an unapproved token is reverted on-chain.</p>
        <div className="flex flex-wrap gap-3">
          {['WETH', 'USDC', 'wstETH'].map(token => (
            <div key={token} className="flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-sm font-medium">{token}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">To add or remove tokens, a contract transaction is required from the vault owner.</p>
      </div>

      {/* ── PRIVATE MODE (app-level) ── */}
      <div className={`rounded-xl p-6 border transition ${privateMode ? 'bg-purple-500/5 border-purple-500/30' : 'bg-gray-900 border-gray-800'}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <svg className={`w-6 h-6 ${privateMode ? 'text-purple-400' : 'text-gray-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-lg font-semibold">Private Mode</h2>
          </div>
          <button
            onClick={togglePrivateMode}
            disabled={toggling || !loaded}
            className={`relative w-14 h-7 rounded-full transition-colors ${privateMode ? 'bg-purple-600' : 'bg-gray-700'} ${toggling ? 'opacity-50' : ''}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${privateMode ? 'translate-x-7' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {privateMode
            ? 'Active — all AI inference for this vault is routed through Venice with zero data retention.'
            : 'Off — your agent can use any AI provider. Toggle on to enforce Venice-only inference.'}
        </p>

        {privateMode && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-purple-300">
              <span className="text-green-400">✓</span>
              <span>Strategy generation routed through Venice AI only</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <span className="text-green-400">✓</span>
              <span>Zero data retention — your financial data is never stored by any AI provider</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <span className="text-green-400">✓</span>
              <span>Non-Venice strategy calls are rejected when Private Mode is active</span>
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Model: <span className="font-mono text-gray-400">llama-3.3-70b</span> via Venice AI · No logs, no training data, no storage
            </p>
          </div>
        )}
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">How Enforcement Works</h2>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            <span>When you approve a strategy, the guardrails (trade limits + approved tokens) are written to a smart contract on Base.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">2.</span>
            <span>Every trade your agent makes goes through the <span className="font-mono text-xs text-gray-500">AgentGuardRouter</span>, which checks the policy contract before forwarding to Uniswap.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">3.</span>
            <span>If a trade exceeds your max trade size, daily cap, or uses an unapproved token — the transaction reverts. The agent physically cannot break the rules.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">4.</span>
            <span>Only your wallet can change these limits. The agent cannot modify its own guardrails.</span>
          </div>
        </div>
      </div>

      {/* ── ON-CHAIN vs OFF-CHAIN ── */}
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
