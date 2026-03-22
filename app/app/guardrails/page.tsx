'use client'

import { useAgentContext } from '../components/AgentContext'
import { useEffect, useState } from 'react'

type EnforcementEvent = {
  type: string
  summary: string
  txHash: string
  guardrailCheck: string
  proof?: Record<string, string>
  blockNumber: number
}

export default function GuardrailsPage() {
  const { vaults, vaultData, hasVault } = useAgentContext()
  const [events, setEvents] = useState<EnforcementEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasVault || !vaults[0]) { setLoading(false); return }
    fetch(`/api/vault/activity?vault=${vaults[0]}`)
      .then(r => r.json())
      .then(d => {
        // Only show swaps — those are the ones that go through policy checks
        const swaps = (d.activities || []).filter((a: any) => a.type === 'swap')
        setEvents(swaps)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [vaults, hasVault])

  if (!hasVault) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">
        Create a vault first to configure guardrails.
      </div>
    )
  }

  const policy = vaultData?.policy
  const vault = vaults[0] as string

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Guardrails</h1>
        <p className="text-sm text-gray-500 mt-1">Smart contract rules checked on every trade. Not promises — on-chain enforcement.</p>
      </div>

      {policy?.active ? (
        <>
          {/* Current limits */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="text-xs text-gray-500 mb-2">Max per trade</div>
              <div className="text-3xl font-bold">{policy.maxPerAction} ETH</div>
              <p className="text-xs text-gray-600 mt-2">Any single trade above this reverts. The contract checks this before the swap executes.</p>
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

          {/* Enforcement log — the proof */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Enforcement log</h3>
              <span className="text-xs text-gray-500">{events.length} policy check{events.length !== 1 ? 's' : ''}</span>
            </div>

            {loading && <div className="text-sm text-gray-500 py-4">Reading from blockchain...</div>}

            {!loading && events.length === 0 && (
              <div className="text-sm text-gray-500 py-4">
                No trades yet. When your agent executes a swap, the policy check result appears here.
              </div>
            )}

            {events.length > 0 && (
              <div className="space-y-3">
                {events.map((ev) => (
                  <div key={ev.txHash} className="bg-gray-800/30 border border-green-500/10 rounded-lg p-4 space-y-3">
                    {/* Result */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-green-400 text-xs">✓</span>
                        </div>
                        <span className="text-sm font-medium text-green-400">Policy passed</span>
                      </div>
                      <a href={`https://sepolia.basescan.org/tx/${ev.txHash}`} target="_blank" rel="noopener"
                        className="text-xs font-mono text-indigo-400 hover:underline">{ev.txHash.slice(0, 10)}…</a>
                    </div>

                    {/* What was checked */}
                    <div className="text-sm text-gray-300">{ev.summary}</div>

                    {/* The actual check */}
                    {ev.proof && (
                      <div className="bg-gray-900/50 rounded-lg divide-y divide-gray-700/30">
                        {Object.entries(ev.proof).map(([key, val]) => (
                          <div key={key} className="flex items-center justify-between px-3 py-2 text-xs">
                            <span className="text-gray-500">{key}</span>
                            <span className={`font-mono ${
                              (val as string).includes('✓') || (val as string).includes('passed') ? 'text-green-400' :
                              (val as string).startsWith('0x') ? 'text-indigo-400' : 'text-gray-300'
                            }`}>
                              {(val as string).startsWith('0x') ? (
                                <a href={`https://sepolia.basescan.org/address/${val}`} target="_blank" rel="noopener" className="hover:underline">
                                  {(val as string).slice(0, 6)}...{(val as string).slice(-4)}
                                </a>
                              ) : val as string}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Guardrail check summary */}
                    {ev.guardrailCheck && (
                      <div className="text-xs text-gray-500 border-t border-gray-700/30 pt-2">
                        {ev.guardrailCheck}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contracts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="font-medium">Contracts</h3>
            <p className="text-xs text-gray-500 mb-2">All verified on Basescan. Click to read the source code and check on-chain state.</p>
            <div className="space-y-2 text-xs">
              {[
                { label: 'AgentPolicy', desc: 'checks limits on every trade', addr: '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' },
                { label: 'AgentGuardRouter', desc: 'wraps Uniswap, calls policy first', addr: '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' },
                { label: 'Your Vault', desc: 'holds your funds', addr: vault },
                { label: 'VaultFactory', desc: 'creates vaults', addr: '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' },
              ].map(c => (
                <a key={c.addr} href={`https://sepolia.basescan.org/address/${c.addr}`} target="_blank" rel="noopener"
                  className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2.5 hover:bg-gray-800/50 transition">
                  <div>
                    <span className="text-gray-300">{c.label}</span>
                    <span className="text-gray-600 ml-2">{c.desc}</span>
                  </div>
                  <span className="font-mono text-indigo-400">{c.addr.slice(0, 6)}...{c.addr.slice(-4)}</span>
                </a>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gray-900 border border-yellow-500/20 rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <div className="text-lg font-medium text-yellow-400 mb-2">No guardrails configured</div>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Your agent cannot trade until you set limits. Guardrails are enforced by a smart contract — once set, even MoltFi cannot bypass them.
          </p>
        </div>
      )}
    </div>
  )
}
