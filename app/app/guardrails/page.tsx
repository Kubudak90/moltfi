'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAccount, useWalletClient, useSwitchChain } from 'wagmi'
import { parseEther, encodeFunctionData } from 'viem'
import { baseSepolia } from 'viem/chains'
import { useAgentContext } from '../components/AgentContext'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const POLICY_ADDR = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const

const TOKENS: Record<string, { address: `0x${string}`; description: string }> = {
  WETH: { address: '0x4200000000000000000000000000000000000006', description: 'Wrapped ETH — the base trading pair' },
  USDC: { address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', description: 'USD Coin — stablecoin pegged to $1' },
  wstETH: { address: '0x0000000000000000000000000000000000000000', description: 'Wrapped staked ETH — earns Lido yield' },
}

const FACTORY_ABI = [
  { name: 'updatePolicy', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'vault', type: 'address' }, { name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }], outputs: [] },
  { name: 'approveToken', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }], outputs: [] },
  { name: 'removeToken', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'vault', type: 'address' }, { name: 'token', type: 'address' }], outputs: [] },
] as const

function StatusBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
      active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-500 border border-gray-700'
    }`}>
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-400' : 'bg-gray-600'}`} />
      {label}
    </span>
  )
}

export default function GuardrailsPage() {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { data: walletClient } = useWalletClient()
  const { vaults, vaultData, hasVault, refreshVaults } = useAgentContext()
  const wrongNetwork = chainId !== baseSepolia.id

  // Private Mode
  const [privateMode, setPrivateMode] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [pmLoaded, setPmLoaded] = useState(false)

  // Editable limits
  const [maxPerTrade, setMaxPerTrade] = useState('')
  const [dailyLimit, setDailyLimit] = useState('')
  const [enabledTokens, setEnabledTokens] = useState<Record<string, boolean>>({ WETH: true, USDC: true, wstETH: true })

  // Original values (to detect changes)
  const [origMax, setOrigMax] = useState('')
  const [origDaily, setOrigDaily] = useState('')
  const [origTokens, setOrigTokens] = useState<Record<string, boolean>>({ WETH: true, USDC: true, wstETH: true })

  // Deploy state
  const [deploying, setDeploying] = useState(false)
  const [deployStatus, setDeployStatus] = useState<string | null>(null)

  const policy = vaultData?.policy
  const policyActive = policy?.active === true
  const hasLimits = policyActive && parseFloat(policy?.maxPerAction || '0') > 0

  // Load on-chain values
  useEffect(() => {
    if (!policy) return
    const max = policy.maxPerAction || '0'
    const daily = policy.dailyLimit || '0'
    setMaxPerTrade(max)
    setDailyLimit(daily)
    setOrigMax(max)
    setOrigDaily(daily)
  }, [policy])

  // Load private mode
  useEffect(() => {
    if (!vaults[0]) return
    fetch(`/api/vault/private-mode?vault=${vaults[0]}`)
      .then(r => r.json())
      .then(d => { setPrivateMode(d.privateMode); setPmLoaded(true) })
      .catch(() => setPmLoaded(true))
  }, [vaults])

  // Detect changes
  const limitsChanged = maxPerTrade !== origMax || dailyLimit !== origDaily
  const tokensChanged = Object.keys(TOKENS).some(t => enabledTokens[t] !== origTokens[t])
  const hasChanges = limitsChanged || tokensChanged

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

  const toggleToken = (token: string) => {
    setEnabledTokens(prev => ({ ...prev, [token]: !prev[token] }))
  }

  const deployChanges = async () => {
    if (!walletClient || !vaults[0]) return
    setDeploying(true)
    setDeployStatus('Preparing transactions...')

    try {
      const vault = vaults[0] as `0x${string}`
      const txHashes: string[] = []

      // Update policy if limits changed
      if (limitsChanged) {
        setDeployStatus('Confirm trade limits update in your wallet...')
        const hash = await walletClient.sendTransaction({
          to: VAULT_FACTORY,
          data: encodeFunctionData({
            abi: FACTORY_ABI,
            functionName: 'updatePolicy',
            args: [vault, parseEther(maxPerTrade || '0'), parseEther(dailyLimit || '0')],
          }),
        })
        txHashes.push(hash)
      }

      // Update tokens if changed
      for (const [symbol, info] of Object.entries(TOKENS)) {
        if (enabledTokens[symbol] !== origTokens[symbol]) {
          const fn = enabledTokens[symbol] ? 'approveToken' : 'removeToken'
          setDeployStatus(`Confirm ${enabledTokens[symbol] ? 'adding' : 'removing'} ${symbol}...`)
          const hash = await walletClient.sendTransaction({
            to: VAULT_FACTORY,
            data: encodeFunctionData({
              abi: FACTORY_ABI,
              functionName: fn,
              args: [vault, info.address],
            }),
          })
          txHashes.push(hash)
        }
      }

      setDeployStatus(`✓ ${txHashes.length} transaction${txHashes.length > 1 ? 's' : ''} confirmed!`)
      // Update originals
      setOrigMax(maxPerTrade)
      setOrigDaily(dailyLimit)
      setOrigTokens({ ...enabledTokens })
      refreshVaults()

      setTimeout(() => setDeployStatus(null), 4000)
    } catch (err: any) {
      if (err.message?.includes('User rejected') || err.message?.includes('denied')) {
        setDeployStatus(null)
      } else {
        setDeployStatus(`Error: ${err.message?.slice(0, 80)}`)
        setTimeout(() => setDeployStatus(null), 5000)
      }
    }
    setDeploying(false)
  }

  const discardChanges = () => {
    setMaxPerTrade(origMax)
    setDailyLimit(origDaily)
    setEnabledTokens({ ...origTokens })
  }

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to view guardrails.</div>
  if (!hasVault) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Create a vault first in the Vault tab.</div>

  const dailySpent = parseFloat(policy?.dailySpent || '0')
  const dailyLimitNum = parseFloat(origDaily || '0')
  const usagePercent = dailyLimitNum > 0 ? Math.min((dailySpent / dailyLimitNum) * 100, 100) : 0
  const usageColor = usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'

  return (
    <div className={`max-w-4xl mx-auto px-6 py-8 space-y-6 ${hasChanges ? 'pb-28' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Guardrails</h1>
          <p className="text-sm text-gray-500">Controls enforced on your agent — on-chain and off-chain</p>
        </div>
        <a href={`https://sepolia.basescan.org/address/${POLICY_ADDR}`} target="_blank" rel="noopener"
          className="text-sm text-indigo-400 hover:underline">View Contract →</a>
      </div>

      {/* ========== PRIVATE MODE ========== */}
      <div className={`rounded-xl p-6 border transition ${privateMode ? 'bg-purple-500/5 border-purple-500/30' : 'bg-gray-900 border-gray-800'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <svg className={`w-6 h-6 ${privateMode ? 'text-purple-400' : 'text-gray-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold">Private Mode</h3>
              <p className="text-xs text-gray-500">Forces all AI strategy generation through Venice (zero data retention)</p>
            </div>
          </div>
          <button
            onClick={togglePrivateMode}
            disabled={toggling || !pmLoaded}
            className={`relative w-14 h-7 rounded-full transition-colors ${privateMode ? 'bg-purple-600' : 'bg-gray-700'} ${toggling ? 'opacity-50' : 'cursor-pointer'}`}
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
              <span>Zero data retention — your financial data is never stored by any AI provider</span>
            </div>
            <div className="flex items-center gap-2 text-purple-300">
              <span className="text-green-400">✓</span>
              <span>Non-Venice inference requests will be rejected</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Your agent can use any AI provider. Enable to enforce Venice-only inference — your financial data stays private.
          </p>
        )}
      </div>

      {/* ========== TRADE LIMITS (EDITABLE) ========== */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Trade Limits</h3>
            <p className="text-xs text-gray-500 mt-0.5">Max amounts your agent can trade. Enforced by smart contract.</p>
          </div>
          <StatusBadge active={hasLimits} label={hasLimits ? 'On-Chain' : 'Not Set'} />
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Max Per Trade</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                value={maxPerTrade}
                onChange={(e) => setMaxPerTrade(e.target.value)}
                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  maxPerTrade !== origMax ? 'border-indigo-500 text-white' : 'border-gray-700 text-gray-300'
                }`}
                placeholder="0.0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">ETH</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Agent cannot execute a single trade larger than this</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Daily Volume Cap</label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  dailyLimit !== origDaily ? 'border-indigo-500 text-white' : 'border-gray-700 text-gray-300'
                }`}
                placeholder="0.0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">ETH</span>
            </div>
            <p className="text-xs text-gray-600 mt-1">Total trading volume allowed per 24 hours</p>
          </div>
        </div>

        {/* Usage bar — only show if limits are active on-chain */}
        {hasLimits && (
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Today&apos;s Usage</span>
              <span className="font-mono text-gray-300">{dailySpent.toFixed(4)} / {dailyLimitNum.toFixed(1)} ETH</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className={`h-full ${usageColor} rounded-full transition-all`} style={{ width: `${usagePercent}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1.5">
              <span>{usagePercent.toFixed(1)}% used</span>
              <span>{(dailyLimitNum - dailySpent).toFixed(4)} ETH remaining</span>
            </div>
          </div>
        )}
      </div>

      {/* ========== TOKEN ALLOWLIST (TOGGLEABLE) ========== */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Approved Tokens</h3>
            <p className="text-xs text-gray-500 mt-0.5">Your agent can only trade these tokens. Click to enable or disable.</p>
          </div>
          <StatusBadge active={hasLimits} label={hasLimits ? 'On-Chain' : 'Not Set'} />
        </div>
        <div className="space-y-2">
          {Object.entries(TOKENS).map(([symbol, info]) => {
            const enabled = enabledTokens[symbol]
            const changed = enabled !== origTokens[symbol]
            return (
              <button
                key={symbol}
                onClick={() => toggleToken(symbol)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition text-left ${
                  enabled
                    ? changed ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-200'
                    : changed ? 'bg-red-500/5 border-red-500/30 text-gray-500' : 'bg-gray-800/50 border-gray-700/50 text-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full transition ${enabled ? 'bg-green-400' : 'bg-gray-600'}`} />
                  <div>
                    <span className="font-medium">{symbol}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{info.description}</p>
                  </div>
                </div>
                <div className={`text-xs px-2 py-0.5 rounded ${
                  enabled ? 'bg-green-500/10 text-green-400' : 'bg-gray-700 text-gray-500'
                }`}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </div>
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-600 mt-3">If the agent tries to trade a disabled token, the smart contract will reject the transaction.</p>
      </div>

      {/* ========== ALWAYS ENFORCED ========== */}
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Always Enforced</h2>
        <p className="text-xs text-gray-600">Built into the smart contracts. Cannot be disabled.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        {[
          { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Principal Protection', desc: 'Your original deposit is locked. The agent can only trade yield above your principal.' },
          { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', title: 'No Self-Modification', desc: 'The agent cannot change its own guardrails. Only your wallet can.' },
          { icon: 'M13 10V3L4 14h7v7l9-11h-7z', title: 'Router-Only Execution', desc: 'All trades go through AgentGuardRouter → policy check → Uniswap. No bypass possible.' },
          { icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2', title: 'Owner-Only Withdrawals', desc: 'Only your wallet can withdraw funds. The agent can trade but never move funds out.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
            </div>
            <div>
              <div className="font-medium text-gray-200">{title}</div>
              <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* On-chain vs Off-chain */}
      <div className="bg-gray-900 border border-indigo-500/20 rounded-xl p-6">
        <h3 className="font-semibold mb-3">Why On-Chain Guardrails Matter</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-400">
          <div>
            <div className="font-medium text-gray-300 mb-2">Off-chain (how others do it)</div>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✕</span> Limits checked in the agent&apos;s own code</li>
              <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✕</span> A prompt injection or bug can bypass them</li>
              <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✕</span> No way for the user to verify enforcement</li>
              <li className="flex items-start gap-2"><span className="text-red-400 shrink-0">✕</span> Agent could modify its own limits</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-indigo-400 mb-2">On-chain (AgentGuard)</div>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-start gap-2"><span className="text-green-400 shrink-0">✓</span> Limits enforced by smart contract on Base</li>
              <li className="flex items-start gap-2"><span className="text-green-400 shrink-0">✓</span> Agent can&apos;t bypass — code is immutable on-chain</li>
              <li className="flex items-start gap-2"><span className="text-green-400 shrink-0">✓</span> Anyone can verify by reading the contract</li>
              <li className="flex items-start gap-2"><span className="text-green-400 shrink-0">✓</span> Only the human wallet can change limits</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ========== DEPLOY CHANGES BAR (sticky bottom) ========== */}
      {hasChanges && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-indigo-500/30 p-4 z-50">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">
                {deployStatus || 'You have unsaved changes'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {!deployStatus && (
                  <>
                    {limitsChanged && 'Trade limits changed. '}
                    {tokensChanged && `Token allowlist changed. `}
                    Requires a wallet transaction to deploy on-chain.
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={discardChanges}
                disabled={deploying}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
              >
                Discard
              </button>
              <button
                onClick={wrongNetwork ? () => switchChain({ chainId: baseSepolia.id }) : deployChanges}
                disabled={deploying || (!walletClient && !wrongNetwork)}
                className={`px-6 py-2 text-sm font-semibold rounded-lg transition ${
                  wrongNetwork
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : deploying
                    ? 'bg-indigo-500/50 text-indigo-200 cursor-wait'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {wrongNetwork ? 'Switch to Base Sepolia' : deploying ? 'Deploying...' : 'Deploy Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
