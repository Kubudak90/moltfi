'use client'

import { useAgentContext } from '../components/AgentContext'
import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseEther } from 'viem'
import { baseSepolia } from 'viem/chains'

const AGENT_POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

const policyAbi = [
  {
    name: 'setPolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'maxPerAction', type: 'uint256' },
      { name: 'dailyLimit', type: 'uint256' },
    ],
    outputs: [],
  },
] as const

export default function GuardrailsPage() {
  const { agents, vaults, vaultData, hasVault, hasAgent } = useAgentContext()
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [maxPerTrade, setMaxPerTrade] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')

  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isSuccess: txConfirmed, isLoading: txWaiting } = useWaitForTransactionReceipt({ hash: txHash })

  if (!hasVault) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">
        Create a vault first to configure guardrails.
      </div>
    )
  }

  const policy = vaultData?.policy
  const vault = vaults[0] as string
  const agentWallet = hasAgent ? agents[0].agentWallet as `0x${string}` : null
  const wrongNetwork = chainId !== baseSepolia.id
  const saving = isPending || txWaiting

  const updatePolicy = async () => {
    if (!agentWallet) return
    if (wrongNetwork) {
      try { await switchChain({ chainId: baseSepolia.id }) } catch { return }
    }
    const max = parseEther(maxPerTrade || policy?.maxPerAction || '0.5')
    const daily = parseEther(dailyLimit || policy?.dailyLimit || '1')
    writeContract({
      account: address,
      address: AGENT_POLICY,
      abi: policyAbi,
      functionName: 'setPolicy',
      args: [agentWallet, max, daily],
      chain: baseSepolia,
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Guardrails</h1>
        <a href={`https://sepolia.basescan.org/address/${AGENT_POLICY}#readContract`}
          target="_blank" rel="noopener"
          className="text-xs text-indigo-400 hover:underline">View contract →</a>
      </div>

      {txConfirmed && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm text-green-400">
          ✓ Guardrails updated on-chain —{' '}
          <a href={`https://sepolia.basescan.org/tx/${txHash}`} target="_blank" rel="noopener" className="underline">
            view transaction
          </a>
        </div>
      )}

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
                {isPending ? 'Confirm in wallet...' : txWaiting ? 'Waiting for confirmation...' : 'Update on-chain'}
              </button>
            </div>
            <p className="text-xs text-gray-600">Your wallet signs this transaction directly on the AgentPolicy contract. You control the rules.</p>
          </div>

          {/* What's enforced */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-400">Enforcement</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-gray-300">Max per trade — every swap checked on-chain before execution</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-gray-300">Daily spending limit — cumulative, resets every 24h</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-gray-300">Token allowlist — only approved tokens (WETH, USDC) can be traded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-gray-300">Policy revocation — instantly freeze all agent trading</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 pt-2">All limits enforced by the AgentPolicy smart contract. The agent cannot bypass them — the transaction reverts on-chain if any limit is exceeded.</p>
          </div>

          {/* Contracts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-400">Contracts</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'AgentPolicy', addr: AGENT_POLICY as string },
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
            {isPending ? 'Confirm in wallet...' : txWaiting ? 'Waiting for confirmation...' : 'Set guardrails'}
          </button>
        </div>
      )}
    </div>
  )
}
