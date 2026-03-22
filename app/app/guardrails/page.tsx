'use client'

import { useAgentContext } from '../components/AgentContext'

export default function GuardrailsPage() {
  const { vaults, vaultData, hasVault } = useAgentContext()

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
        <p className="text-sm text-gray-500 mt-1">On-chain rules that your agent cannot bypass. Every trade is checked against these limits before execution.</p>
      </div>

      {/* Current limits */}
      {policy?.active ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm font-medium text-green-400">Active</span>
            </div>
            <a href={`https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc#readContract`}
              target="_blank" rel="noopener"
              className="text-xs text-indigo-400 hover:underline">View contract on Basescan →</a>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-5">
              <div className="text-xs text-gray-500 mb-2">Max per trade</div>
              <div className="text-3xl font-bold">{policy.maxPerAction} ETH</div>
              <p className="text-xs text-gray-600 mt-2">Any single trade above this amount will revert. The smart contract checks this before the swap executes.</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-5">
              <div className="text-xs text-gray-500 mb-2">Daily limit</div>
              <div className="text-3xl font-bold">{policy.dailyLimit} ETH</div>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Used today: {policy.dailySpent} ETH</span>
                  <span>Remaining: {policy.remaining} ETH</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (parseFloat(policy.dailySpent) / parseFloat(policy.dailyLimit)) * 100)}%` }} />
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">Total volume cap per 24h period. Resets automatically. If the agent hits this, all further trades revert until tomorrow.</p>
            </div>
          </div>

          {/* How enforcement works */}
          <div className="border-t border-gray-800 pt-5 space-y-4">
            <h3 className="text-sm font-medium">How enforcement works</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <div className="font-medium text-gray-300">1. Agent sends trade</div>
                <p className="text-gray-500">Your agent says &quot;swap 0.5 ETH to USDC&quot; via the MoltFi API. Venice AI understands the request.</p>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-300">2. Smart contract checks policy</div>
                <p className="text-gray-500">The AgentGuardRouter calls AgentPolicy before executing. It checks trade size and daily volume against your limits.</p>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-gray-300">3. Pass → trade executes. Fail → reverts.</div>
                <p className="text-gray-500">If within limits, the swap goes through Uniswap V3. If over limits, the entire transaction reverts — no funds move.</p>
              </div>
            </div>
          </div>

          {/* Contracts */}
          <div className="border-t border-gray-800 pt-5">
            <h3 className="text-sm font-medium mb-3">Contracts</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2">
                <span className="text-gray-500">AgentPolicy (enforces limits)</span>
                <a href="https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc" target="_blank" rel="noopener"
                  className="font-mono text-indigo-400 hover:underline">0x6364...06Fbc</a>
              </div>
              <div className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2">
                <span className="text-gray-500">AgentGuardRouter (wraps Uniswap)</span>
                <a href="https://sepolia.basescan.org/address/0x5Cc04847CE5A81319b55D34F9fB757465D3677E6" target="_blank" rel="noopener"
                  className="font-mono text-indigo-400 hover:underline">0x5Cc0...77E6</a>
              </div>
              <div className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2">
                <span className="text-gray-500">Your Vault</span>
                <a href={`https://sepolia.basescan.org/address/${vault}`} target="_blank" rel="noopener"
                  className="font-mono text-indigo-400 hover:underline">{vault.slice(0, 6)}...{vault.slice(-4)}</a>
              </div>
              <div className="flex items-center justify-between bg-gray-800/30 rounded-lg px-3 py-2">
                <span className="text-gray-500">VaultFactory</span>
                <a href="https://sepolia.basescan.org/address/0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774" target="_blank" rel="noopener"
                  className="font-mono text-indigo-400 hover:underline">0x672E...9774</a>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-3">All contracts are verified on Basescan. Click any address to read the source code and verify on-chain state yourself.</p>
          </div>
        </div>
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
