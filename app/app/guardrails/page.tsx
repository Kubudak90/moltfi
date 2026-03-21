'use client'

import { useAccount } from 'wagmi'
import { useAgentContext } from '../components/AgentContext'

const POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

export default function GuardrailsPage() {
  const { address } = useAccount()
  const { vaultData, hasVault } = useAgentContext()

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to view guardrails.</div>
  if (!hasVault) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Create a vault first in the Vault tab.</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guardrails</h1>
          <p className="text-sm text-gray-500">On-chain limits your agent can never exceed — enforced by smart contract</p>
        </div>
        <a href={`https://sepolia.basescan.org/address/${POLICY}`} target="_blank" rel="noopener"
          className="text-sm text-indigo-400 hover:underline">View Contract →</a>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">How It Works</h2>
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
            <span>Only YOU (the vault owner) can change guardrails or pause the agent. The agent has no way to modify its own limits.</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Current Limits</h2>
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
          <p className="text-sm text-gray-500">No active guardrails. Approve a strategy to set them.</p>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Approved Tokens</h2>
        <div className="flex gap-3">
          {['WETH', 'USDC', 'wstETH'].map(token => (
            <div key={token} className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium">
              {token}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">Your agent can only interact with these tokens.</p>
      </div>
    </div>
  )
}
