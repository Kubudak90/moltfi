'use client'

import { useAgentContext } from '../components/AgentContext'
import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseEther } from 'viem'
import { base, baseSepolia } from 'viem/chains'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const AGENT_POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

const factoryAbi = [
  {
    name: 'updatePolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'vault', type: 'address' },
      { name: 'maxPerAction', type: 'uint256' },
      { name: 'dailyLimit', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'revokePolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }],
    outputs: [],
  },
  {
    name: 'approveToken', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }],
    outputs: [],
  },
  {
    name: 'removeToken', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }],
    outputs: [],
  },
] as const

const KNOWN_TOKENS = [
  { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' },
  { symbol: 'USDC', address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' },
]

export default function GuardrailsPage() {
  const { vaults, vaultData, hasVault, refreshVaults } = useAgentContext()
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  // Pending edits (not yet submitted)
  const [maxPerTrade, setMaxPerTrade] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')
  const [tokenChanges, setTokenChanges] = useState<Record<string, boolean>>({}) // addr -> desired state
  const [freezeConfirm, setFreezeConfirm] = useState(false)

  // Transaction queue
  const [txQueue, setTxQueue] = useState<Array<{ fn: string; args: any[]; label: string }>>([])
  const [txProgress, setTxProgress] = useState('')

  const { writeContract, data: txHash, isPending, reset: resetTx } = useWriteContract()
  const { isSuccess: txConfirmed, isLoading: txWaiting } = useWaitForTransactionReceipt({ hash: txHash })
  const [lastConfirmedHash, setLastConfirmedHash] = useState<string | null>(null)

  const policy = vaultData?.policy
  const vault = vaults[0] as `0x${string}`
  const wrongNetwork = chainId !== base.id && chainId !== baseSepolia.id
  const saving = isPending || txWaiting

  // Determine if there are pending changes
  const limitsChanged = maxPerTrade !== '' || dailyLimit !== ''
  const tokensChanged = Object.keys(tokenChanges).length > 0
  const hasChanges = limitsChanged || tokensChanged

  // Get current token state from on-chain data
  const getTokenApproved = (symbol: string, addr: string): boolean => {
    // If user toggled it, show the pending state
    if (addr in tokenChanges) return tokenChanges[addr]
    // Otherwise show on-chain state
    const policyData = vaultData as any
    if (symbol === 'WETH') return policyData?.approvedTokens?.WETH !== false
    if (symbol === 'USDC') return policyData?.approvedTokens?.USDC !== false
    return true
  }

  const toggleToken = (addr: string) => {
    const currentOnChain = KNOWN_TOKENS.find(t => t.address === addr)
    if (!currentOnChain) return
    const currentState = getTokenApproved(currentOnChain.symbol, addr)
    const newState = !currentState

    // If toggling back to on-chain state, remove from changes
    const policyData = vaultData as any
    const onChainState = currentOnChain.symbol === 'WETH'
      ? policyData?.approvedTokens?.WETH !== false
      : policyData?.approvedTokens?.USDC !== false

    if (newState === onChainState) {
      const updated = { ...tokenChanges }
      delete updated[addr]
      setTokenChanges(updated)
    } else {
      setTokenChanges({ ...tokenChanges, [addr]: newState })
    }
  }

  const discardChanges = () => {
    setMaxPerTrade('')
    setDailyLimit('')
    setTokenChanges({})
  }

  const saveChanges = async () => {
    if (!vault) return
    if (wrongNetwork) {
      try { await switchChain({ chainId: base.id }) } catch { return }
    }

    // Build transaction queue
    const queue: Array<{ fn: string; args: any[]; label: string }> = []

    if (limitsChanged) {
      const max = parseEther(maxPerTrade || policy?.maxPerAction || '0.5')
      const daily = parseEther(dailyLimit || policy?.dailyLimit || '1')
      queue.push({ fn: 'updatePolicy', args: [vault, max, daily], label: 'Updating limits' })
    }

    for (const [addr, approve] of Object.entries(tokenChanges)) {
      const symbol = KNOWN_TOKENS.find(t => t.address === addr)?.symbol || addr.slice(0, 8)
      queue.push({
        fn: approve ? 'approveToken' : 'removeToken',
        args: [vault, addr as `0x${string}`],
        label: approve ? `Approving ${symbol}` : `Removing ${symbol}`,
      })
    }

    if (queue.length === 0) return

    // Execute first transaction, rest will be handled by effect
    setTxQueue(queue.slice(1))
    setTxProgress(`${queue[0].label} (1/${queue.length})`)
    writeContract({
      account: address,
      address: VAULT_FACTORY,
      abi: factoryAbi,
      functionName: queue[0].fn as any,
      args: queue[0].args as any,
      chain: chainId === baseSepolia.id ? baseSepolia : base,
    })
  }

  // When a transaction confirms, execute next in queue
  useEffect(() => {
    if (txConfirmed && txHash && txHash !== lastConfirmedHash) {
      setLastConfirmedHash(txHash)
      if (txQueue.length > 0) {
        const next = txQueue[0]
        const remaining = txQueue.slice(1)
        const total = txQueue.length + 1
        const current = total - remaining.length
        setTxQueue(remaining)
        setTxProgress(`${next.label} (${current}/${total})`)
        setTimeout(() => {
          resetTx()
          writeContract({
            account: address,
            address: VAULT_FACTORY,
            abi: factoryAbi,
            functionName: next.fn as any,
            args: next.args as any,
            chain: chainId === baseSepolia.id ? baseSepolia : base,
          })
        }, 500)
      } else {
        // All done
        setTxProgress('')
        setMaxPerTrade('')
        setDailyLimit('')
        setTokenChanges({})
        refreshVaults()
      }
    }
  }, [txConfirmed, txHash])

  const freezePolicy = async () => {
    if (!vault) return
    if (wrongNetwork) {
      try { await switchChain({ chainId: base.id }) } catch { return }
    }
    setTxProgress('Freezing all trading')
    writeContract({
      account: address,
      address: VAULT_FACTORY,
      abi: factoryAbi,
      functionName: 'revokePolicy',
      args: [vault],
      chain: chainId === baseSepolia.id ? baseSepolia : base,
    })
    setFreezeConfirm(false)
  }

  if (!hasVault) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">
        Create a vault first to configure guardrails.
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guardrails</h1>
          <p className="text-sm text-gray-500 mt-1">Scoped access rules for your agent&apos;s API key — enforced on-chain.</p>
        </div>
        <a href={`${chainId === 84532 ? "https://sepolia.basescan.org" : "https://basescan.org"}/address/${AGENT_POLICY}#readContract`}
          target="_blank" rel="noopener"
          className="text-xs text-blue-400 hover:underline">View contract →</a>
      </div>

      {txConfirmed && txQueue.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm text-green-400">
          ✓ Guardrails updated on-chain —{' '}
          <a href={`${chainId === 84532 ? "https://sepolia.basescan.org" : "https://basescan.org"}/tx/${txHash}`} target="_blank" rel="noopener" className="underline">
            view transaction
          </a>
        </div>
      )}

      {txProgress && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-400">
          {isPending ? `${txProgress} — confirm in wallet...` : txWaiting ? `${txProgress} — waiting for confirmation...` : txProgress}
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
                  <div className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (parseFloat(policy.dailySpent) / parseFloat(policy.dailyLimit)) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Change limits */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="font-medium">Trading limits</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Max per trade (ETH)</label>
                <input type="number" step="0.01" min="0"
                  value={maxPerTrade} onChange={e => setMaxPerTrade(e.target.value)}
                  placeholder={policy.maxPerAction}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Daily limit (ETH)</label>
                <input type="number" step="0.1" min="0"
                  value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}
                  placeholder={policy.dailyLimit}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <p className="text-xs text-gray-600">Changes are staged until you save below.</p>
          </div>

          {/* Token allowlist */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="font-medium">Token allowlist</h3>
            <p className="text-xs text-gray-500">Only approved tokens can be traded. Click to toggle — changes are staged until you save.</p>
            <div className="space-y-3">
              {KNOWN_TOKENS.map(t => {
                const isApproved = getTokenApproved(t.symbol, t.address)
                const isChanged = t.address in tokenChanges
                return (
                  <div key={t.symbol} className={`flex items-center justify-between rounded-lg p-3 transition ${isChanged ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-gray-800/50'}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{t.symbol}</span>
                      <span className="text-xs text-gray-500 font-mono">{t.address.slice(0, 6)}...{t.address.slice(-4)}</span>
                      {isChanged && <span className="text-xs text-yellow-400">(changed)</span>}
                    </div>
                    <button
                      onClick={() => toggleToken(t.address)}
                      disabled={saving}
                      className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${
                        isApproved
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {isApproved ? 'Approved' : 'Blocked'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Emergency freeze */}
          <div className="bg-gray-900 border border-red-500/20 rounded-xl p-6 space-y-4">
            <h3 className="font-medium text-red-400">Emergency freeze</h3>
            <p className="text-sm text-gray-400">Instantly revoke all agent trading permissions. The policy becomes inactive — no trades will execute until you set new limits.</p>
            {!freezeConfirm ? (
              <button onClick={() => setFreezeConfirm(true)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg transition border border-red-500/20">
                Freeze all trading
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={freezePolicy} disabled={saving}
                  className="bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition">
                  {isPending ? 'Confirm in wallet...' : txWaiting ? 'Freezing...' : 'Confirm freeze'}
                </button>
                <button onClick={() => setFreezeConfirm(false)}
                  className="text-gray-500 hover:text-gray-300 text-sm px-3 py-2 transition">
                  Cancel
                </button>
              </div>
            )}
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
                <span className="text-gray-300">Token allowlist — only approved tokens can be traded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-gray-300">Emergency freeze — instantly revoke all agent trading</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 pt-2">These aren&apos;t software settings — they&apos;re on-chain rules. If your agent exceeds any limit, the transaction reverts automatically. No funds move.</p>
          </div>

          {/* Contracts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-400">Contracts</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: 'AgentPolicy', addr: AGENT_POLICY as string },
                { label: 'VaultFactory', addr: VAULT_FACTORY as string },
                { label: 'AgentGuardRouter', addr: '0x5Cc04847CE5A81319b55D34F9fB757465D3677E6' },
                { label: 'Vault', addr: vault },
              ].map(c => (
                <div key={c.addr} className="flex items-center justify-between">
                  <span className="text-gray-500">{c.label}</span>
                  <a href={`${chainId === 84532 ? "https://sepolia.basescan.org" : "https://basescan.org"}/address/${c.addr}`} target="_blank" rel="noopener"
                    className="font-mono text-blue-400 hover:underline">{c.addr.slice(0, 6)}...{c.addr.slice(-4)}</a>
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
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Daily limit (ETH)</label>
              <input type="number" step="0.1" min="0"
                value={dailyLimit} onChange={e => setDailyLimit(e.target.value)}
                placeholder="1"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
          </div>
          <button onClick={saveChanges} disabled={saving || (!maxPerTrade && !dailyLimit)}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm px-4 py-2 rounded-lg transition">
            {isPending ? 'Confirm in wallet...' : txWaiting ? 'Waiting for confirmation...' : 'Set guardrails'}
          </button>
        </div>
      )}
      {/* Fixed bottom save bar — appears when there are pending changes */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-blue-500/30 px-6 py-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="text-sm text-gray-300">
              <span className="text-blue-400 font-medium">Unsaved changes</span>
              <span className="text-gray-500 ml-2">
                {[
                  limitsChanged && 'limits',
                  tokensChanged && `${Object.keys(tokenChanges).length} token${Object.keys(tokenChanges).length > 1 ? 's' : ''}`,
                ].filter(Boolean).join(' + ')}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={discardChanges}
                className="text-gray-500 hover:text-gray-300 text-sm px-3 py-2 transition">
                Cancel
              </button>
              <button onClick={saveChanges} disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm px-5 py-2 rounded-lg transition font-medium">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
