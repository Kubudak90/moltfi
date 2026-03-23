'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseEther } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { useAgentContext } from '../components/AgentContext'

const VAULT_FACTORY_SEPOLIA = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const VAULT_FACTORY_MAINNET = '0x5AFC9Ff3230eE0E4bE9e110F7672584Ab593A4F6' as const
const WETH = '0x4200000000000000000000000000000000000006' as const
const USDC_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const
const USDC_MAINNET = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const
const WSTETH = '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452' as const

const factoryAbi = [
  { name: 'createVault', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'agent', type: 'address' }, { name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }, { name: 'tokens', type: 'address[]' }],
    outputs: [{ name: 'vault', type: 'address' }] },
] as const

const vaultAbi = [
  { name: 'depositETH', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] },
  { name: 'withdrawETH', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'setAgent', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'newAgent', type: 'address' }], outputs: [] },
] as const

export default function DashboardClient() {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { agents, vaults, vaultData, hasAgent, hasVault, ethPrice, rates, serverAgentWallet, refreshVaults } = useAgentContext()
  const [depositAmount, setDepositAmount] = useState('0.01')
  const [withdrawToken, setWithdrawToken] = useState<'ETH'|'WETH'|'USDC'>('ETH')
  const [withdrawAmount, setWithdrawAmount] = useState('0.01')
  const [txStatus, setTxStatus] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [perf, setPerf] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])

  useEffect(() => {
    if (vaults[0]) {
      const cs = chainId === 8453 ? '&chain=mainnet' : ''
      fetch(`/api/vault/performance?vault=${vaults[0]}${cs}`)
        .then(r => r.ok ? r.json() : null).then(d => d && setPerf(d)).catch(() => {})
      fetch(`/api/vault/activity?vault=${vaults[0]}${cs}`)
        .then(r => r.ok ? r.json() : null).then(d => d && setActivity((d.activities || []).slice(0, 3))).catch(() => {})
    }
  }, [vaults, chainId])

  const { writeContract, data: txHash } = useWriteContract()
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const wrongNetwork = chainId !== base.id && chainId !== baseSepolia.id

  const ensureNetwork = async (): Promise<boolean> => {
    if (wrongNetwork) {
      try {
        await switchChain({ chainId: base.id })
        // Give wallet a moment to switch
        await new Promise(r => setTimeout(r, 500))
        return true
      } catch {
        setError('Please switch to Base in your wallet.')
        return false
      }
    }
    return true
  }

  if (txConfirmed && txStatus) {
    setTimeout(() => { setTxStatus(''); refreshVaults() }, 1500)
  }

  const createVault = async () => {
    // Use the agent wallet from registration, or the server's agent wallet
    const agentAddr = agents[0]?.agentWallet || serverAgentWallet
    if (!agentAddr) return
    if (!(await ensureNetwork())) return
    setTxStatus('Creating vault...')
    const isMainnet = chainId === base.id
    const factory = isMainnet ? VAULT_FACTORY_MAINNET : VAULT_FACTORY_SEPOLIA
    const usdc = isMainnet ? USDC_MAINNET : USDC_SEPOLIA
    const tokens = isMainnet ? [WETH, usdc, WSTETH] : [WETH, usdc]
    writeContract({ account: address, address: factory, abi: factoryAbi, functionName: 'createVault',
      args: [agentAddr as `0x${string}`, parseEther('1'), parseEther('5'), tokens], chain: isMainnet ? base : baseSepolia })
  }

  const depositETH = async () => {
    if (!vaults[0]) return
    if (!(await ensureNetwork())) return
    setTxStatus('Depositing ETH...')
    writeContract({ account: address, address: vaults[0] as `0x${string}`, abi: vaultAbi, functionName: 'depositETH',
      value: parseEther(depositAmount), chain: chainId === baseSepolia.id ? baseSepolia : base })
  }

  const withdraw = async () => {
    const amt = withdrawAmount || '0'
    if (parseFloat(amt) <= 0) { setError('Enter an amount to withdraw'); return }
    if (!vaults[0]) { setError('No vault found'); return }
    if (!(await ensureNetwork())) return
    setError('')
    try {
      setTxStatus(`Withdrawing ${amt} ${withdrawToken}...`)
      if (withdrawToken === 'ETH') {
        writeContract({ account: address, address: vaults[0] as `0x${string}`, abi: vaultAbi, functionName: 'withdrawETH',
          args: [parseEther(amt)], chain: chainId === baseSepolia.id ? baseSepolia : base })
      } else {
        const usdc = chainId === base.id ? USDC_MAINNET : USDC_SEPOLIA
        const token = withdrawToken === 'WETH' ? WETH : usdc
        const decimals = withdrawToken === 'USDC' ? 6 : 18
        const amount = BigInt(Math.floor(parseFloat(amt) * (10 ** decimals)))
        writeContract({ account: address, address: vaults[0] as `0x${string}`, abi: vaultAbi, functionName: 'withdraw',
          args: [token, amount], chain: chainId === baseSepolia.id ? baseSepolia : base })
      }
    } catch (e: any) {
      setError(`Withdraw failed: ${e.message}`)
      setTxStatus('')
    }
  }

  const updateAgent = async () => {
    if (!vaults[0] || !serverAgentWallet) { setError('Missing vault or server agent address'); return }
    if (!(await ensureNetwork())) return
    setError('')
    try {
      setTxStatus('Updating vault agent...')
      writeContract({
        account: address,
        address: vaults[0] as `0x${string}`,
        abi: vaultAbi,
        functionName: 'setAgent',
        args: [serverAgentWallet as `0x${string}`],
        chain: chainId === baseSepolia.id ? baseSepolia : base,
      })
    } catch (e: any) {
      setError(`Agent update failed: ${e.message}`)
      setTxStatus('')
    }
  }

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-bold mx-auto mb-6">AG</div>
        <h1 className="text-3xl font-bold mb-3">Connect Your Wallet</h1>
        <p className="text-gray-400">Connect your wallet to get started.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {wrongNetwork && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="font-semibold text-red-300">Wrong Network</div>
            <p className="text-sm text-red-400/80 mt-1">You&apos;re connected to the wrong network. MoltFi runs on <strong>Base</strong>. Switch your wallet to Base mainnet or Base Sepolia.</p>
          </div>
          <button onClick={() => switchChain({ chainId: base.id })}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium transition shrink-0">
            Switch to Base
          </button>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300">
          {error}<button onClick={() => setError('')} className="ml-2 text-red-400">×</button>
        </div>
      )}
      {txStatus && (
        <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300">
          {txConfirmed ? '✓ Transaction confirmed!' : txStatus}
        </div>
      )}

      {/* No agent yet */}
      {!hasAgent && (() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        const skillSnippet = `Read this skill file and follow the instructions to manage my DeFi vault:\ncurl -s ${origin}/api/skill\n\nMy wallet: ${address}`

        function doCopy(text: string) {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => fallbackCopy(text))
          } else { fallbackCopy(text) }
        }
        function fallbackCopy(text: string) {
          const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
          document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
          setCopied(true); setTimeout(() => setCopied(false), 2000)
        }

        return (
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-8">
            <h2 className="text-xl font-bold mb-2 text-center">Connect Your Agent</h2>
            <p className="text-gray-400 mb-6 text-center text-sm">Copy this and paste it into your AI agent&apos;s chat.</p>
            <div className="bg-gray-800/50 rounded-lg p-4 relative group">
              <button onClick={() => doCopy(skillSnippet)}
                className="absolute top-3 right-3 text-gray-500 hover:text-blue-400 transition p-1.5 rounded-lg hover:bg-gray-700/50">
                {copied ? <span className="text-green-400 text-xs font-medium px-1">Copied!</span> : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
              </button>
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap pr-8 leading-relaxed">{skillSnippet}</pre>
            </div>
            <p className="text-center text-xs text-gray-600 mt-4">Waiting for agent... (auto-refreshes)</p>
          </div>
        )
      })()}

      {/* No vault yet — show create button */}
      {!hasVault && address && (
        <div className="bg-gray-900 border border-blue-500/30 rounded-xl p-8 text-center space-y-4">
          {hasAgent && (
            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800/50 rounded-lg justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
                {agents[0].agentName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{agents[0].agentName}</div>
                <div className="text-xs text-green-400">● Connected</div>
              </div>
            </div>
          )}
          <h2 className="text-xl font-bold">Create Your Vault</h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Deploy a smart contract vault on Base. Your wallet owns it. The agent can only trade within your guardrails.
          </p>
          <button onClick={createVault} disabled={!serverAgentWallet && !hasAgent}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white px-8 py-3 rounded-lg text-sm font-medium transition">
            {txStatus || 'Create Vault'}
          </button>
          <p className="text-xs text-gray-600">Default guardrails: 1 ETH max per trade, 5 ETH daily limit. You can change these after.</p>
        </div>
      )}

      {/* Vault active */}
      {hasVault && (
        <>
          {vaultData?.agent && serverAgentWallet && vaultData.agent !== '0x0' && vaultData.agent.toLowerCase() !== serverAgentWallet.toLowerCase() && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-yellow-300">Vault agent mismatch</div>
                <p className="text-sm text-yellow-200/80 mt-1">
                  This vault trusts <span className="font-mono">{vaultData.agent}</span>, but the current server agent is <span className="font-mono">{serverAgentWallet}</span>.
                  Update the vault agent once with your connected wallet so production can trade on this vault.
                </p>
              </div>
              <button onClick={updateAgent}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 px-4 py-2 rounded-lg text-sm font-medium transition shrink-0">
                Update Agent
              </button>
            </div>
          )}

          {/* Market data — above the vault */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">ETH Price</div>
              <div className="text-lg font-bold">{ethPrice ? `$${ethPrice.toLocaleString()}` : '—'}</div>
              {rates?.prices?.eth24hChange != null && (
                <div className={`text-xs ${rates.prices.eth24hChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {rates.prices.eth24hChange >= 0 ? '+' : ''}{rates.prices.eth24hChange.toFixed(2)}% 24h
                </div>
              )}
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">Staking Rate (Lido)</div>
              <div className="text-lg font-bold">{rates?.lido ? `${rates.lido.smaApr.toFixed(2)}%` : '—'}</div>
              <div className="text-xs text-gray-600">current APR</div>
            </div>
          </div>

          {/* Vault */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            {(() => {
              const weth = parseFloat(vaultData?.balances?.WETH || '0')
              const usdc = parseFloat(vaultData?.balances?.USDC || '0')
              const eth = parseFloat(vaultData?.balances?.ETH || '0')
              const wsteth = parseFloat(vaultData?.balances?.wstETH || '0')
              const price = ethPrice || 0
              const wstethValueEth = wsteth * 1.17 // wstETH trades at ~1.17x ETH
              const totalEth = eth + weth + wstethValueEth
              const totalUsd = price ? (totalEth * price + usdc) : 0

              return (
                <div className="space-y-5">
                  {/* Header with vault links */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Vault</h2>
                    <a href={`${chainId === 84532 ? "https://sepolia.basescan.org" : "https://basescan.org"}/address/${vaults[0]}`} target="_blank" rel="noopener"
                      className="text-xs font-mono text-blue-400 hover:underline">{(vaults[0] as string).slice(0, 6)}...{(vaults[0] as string).slice(-4)}</a>
                  </div>

                  

                  {/* Balance hero */}
                  <div className="bg-gray-800/50 rounded-lg p-5">
                    <div className="text-xs text-gray-500 mb-1">Total Balance</div>
                    {(() => {
                      const usdcInEth = price ? usdc / price : 0
                      const totalInEth = totalEth + usdcInEth
                      return (
                        <>
                          <div className="text-3xl font-bold">{totalInEth > 0 ? `${totalInEth.toFixed(4)} ETH` : '—'}</div>
                          {totalUsd > 0 && <div className="text-sm text-gray-500 mt-1">≈ ${totalUsd.toFixed(2)}</div>}
                        </>
                      )
                    })()}
                    
                  </div>

                  {/* wstETH yield card */}
                  {wsteth > 0 && (
                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-400">Lido wstETH</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-400/15 text-green-400 border border-green-500/25">Earning yield</span>
                        </div>
                        {rates?.lido && <span className="text-xs text-green-400">{rates.lido.smaApr.toFixed(2)}% APR</span>}
                      </div>
                      <div className="text-lg font-bold">{wsteth.toFixed(6)} wstETH</div>
                      <div className="text-xs text-gray-500 mt-1">
                        ≈ {wstethValueEth.toFixed(6)} ETH {price ? `($${(wstethValueEth * price).toFixed(2)})` : ''}
                        {' · '}Yield accrues automatically via exchange rate
                      </div>
                    </div>
                  )}

                  {/* Guardrails summary */}
                  {vaultData?.policy?.active ? (
                    <a href="/guardrails" className="flex items-center justify-between bg-gray-800/30 rounded-lg p-3 hover:bg-gray-800/50 transition">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-gray-400">Guardrails active — {vaultData.policy.maxPerAction} ETH/trade, {vaultData.policy.remaining} ETH remaining today</span>
                      </div>
                      <span className="text-xs text-blue-400">Manage →</span>
                    </a>
                  ) : (
                    <a href="/guardrails" className="flex items-center justify-between bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3 hover:bg-yellow-500/10 transition">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-yellow-400" />
                        <span className="text-yellow-400">No guardrails set — agent cannot trade</span>
                      </div>
                      <span className="text-xs text-blue-400">Set up →</span>
                    </a>
                  )}

                  {/* Deposit */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-gray-800/50">
                    <div>
                      <div className="text-xs text-gray-500 mb-2 font-medium">Deposit</div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                            step="0.001" min="0" placeholder="0.01"
                            className="w-full bg-gray-800 border border-gray-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 pr-12" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">ETH</span>
                        </div>
                        <button onClick={depositETH}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
                          Deposit
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1.5">Sends ETH from your wallet into the vault contract.</p>
                    </div>
                    <div>
                <div className="text-xs text-gray-500 mb-2 font-medium">Withdraw</div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                      step="0.001" min="0" placeholder="0.01"
                      className="w-full bg-gray-800 border border-gray-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 pr-16" />
                    <select value={withdrawToken} onChange={e => setWithdrawToken(e.target.value as any)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-gray-700 border-none rounded text-xs text-gray-300 py-1 px-1.5 focus:outline-none">
                      <option value="ETH">ETH</option>
                      <option value="WETH">WETH</option>
                      <option value="USDC">USDC</option>
                    </select>
                  </div>
                  <button onClick={withdraw}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
                    Withdraw
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1.5">Owner-only — funds go back to your wallet.</p>
              </div>
            </div>

                  {/* Recent activity */}
                  {activity.length > 0 && (
                    <div className="pt-3 border-t border-gray-800/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">Recent Activity</span>
                        <a href="/activity" className="text-xs text-blue-400 hover:underline">View all →</a>
                      </div>
                      {activity.map((a, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5">
                          <span className="text-gray-400">{a.summary}</span>
                          <a href={`${chainId === 84532 ? "https://sepolia.basescan.org" : "https://basescan.org"}/tx/${a.txHash}`} target="_blank" rel="noopener"
                            className="text-blue-400 hover:underline font-mono shrink-0 ml-2">{a.txHash.slice(0, 8)}…</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* How it works — Human vs Agent */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-3">How It Works</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-sm font-medium text-blue-400 mb-2">You (vault owner)</div>
                <p className="text-xs text-gray-400">Your wallet owns this vault. You deposit and withdraw funds, set trading limits, choose which tokens are allowed, and can freeze trading anytime. Your wallet signed the transaction that created this vault — you&apos;re the only one who can change the rules.</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-sm font-medium text-green-400 mb-2">Your agent (API access)</div>
                <p className="text-xs text-gray-400 mb-2">Your agent gets an API key to trade within the policies you set. Plain English, no blockchain knowledge needed:</p>
                <pre className="text-xs font-mono text-gray-300 bg-gray-900/80 rounded p-2 overflow-x-auto">POST /api/agent{'\n'}Authorization: Bearer mf_...{'\n'}{`{"message": "swap 0.01 WETH to USDC"}`}</pre>
                <p className="text-xs text-gray-500 mt-2">Every trade goes through the smart contract. If it exceeds your policies → transaction reverts automatically.</p>
              </div>
            </div>
          </div>

          {/* What you control */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-3">You Configure the Scope</h3>
            <p className="text-xs text-gray-500 mb-3">As vault owner, you decide exactly what your agent is allowed to do. These policies are enforced on-chain.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="text-blue-400 mt-0.5">→</span> Max amount per trade
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="text-blue-400 mt-0.5">→</span> Daily spending cap
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="text-blue-400 mt-0.5">→</span> Which tokens can be traded
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-300">
                  <span className="text-blue-400 mt-0.5">→</span> Instant freeze (revoke all trading)
                </div>
              </div>
            </div>
            <a href="/guardrails" className="inline-block mt-4 text-xs text-blue-400 hover:underline">Manage policies →</a>
          </div>

        </>
      )}
    </div>
  )
}
