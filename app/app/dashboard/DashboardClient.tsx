'use client'

import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { parseEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { useAgentContext } from '../components/AgentContext'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const
const WETH = '0x4200000000000000000000000000000000000006' as const
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const

const factoryAbi = [
  { name: 'createVault', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'agent', type: 'address' }, { name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }, { name: 'tokens', type: 'address[]' }],
    outputs: [{ name: 'vault', type: 'address' }] },
] as const

const vaultAbi = [
  { name: 'depositETH', type: 'function', stateMutability: 'payable', inputs: [], outputs: [] },
  { name: 'withdrawETH', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount', type: 'uint256' }], outputs: [] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [] },
] as const

export default function DashboardClient() {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const { agents, vaults, vaultData, hasAgent, hasVault, ethPrice, rates, refreshVaults } = useAgentContext()
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
      fetch(`/api/vault/performance?vault=${vaults[0]}`)
        .then(r => r.json()).then(setPerf).catch(() => {})
      fetch(`/api/vault/activity?vault=${vaults[0]}`)
        .then(r => r.json()).then(d => setActivity((d.activities || []).slice(0, 3))).catch(() => {})
    }
  }, [vaults])

  const { writeContract, data: txHash } = useWriteContract()
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const wrongNetwork = chainId !== baseSepolia.id

  const ensureNetwork = async (): Promise<boolean> => {
    if (wrongNetwork) {
      try {
        await switchChain({ chainId: baseSepolia.id })
        // Give wallet a moment to switch
        await new Promise(r => setTimeout(r, 500))
        return true
      } catch {
        setError('Please switch to Base Sepolia in your wallet.')
        return false
      }
    }
    return true
  }

  if (txConfirmed && txStatus) {
    setTimeout(() => { setTxStatus(''); refreshVaults() }, 1500)
  }

  const createVault = async () => {
    if (!agents[0]) return
    if (!(await ensureNetwork())) return
    setTxStatus('Creating vault...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'createVault',
      args: [agents[0].agentWallet as `0x${string}`, parseEther('1'), parseEther('5'), [WETH, USDC]], chain: baseSepolia })
  }

  const depositETH = async () => {
    if (!vaults[0]) return
    if (!(await ensureNetwork())) return
    setTxStatus('Depositing ETH...')
    writeContract({ account: address, address: vaults[0] as `0x${string}`, abi: vaultAbi, functionName: 'depositETH',
      value: parseEther(depositAmount), chain: baseSepolia })
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
          args: [parseEther(amt)], chain: baseSepolia })
      } else {
        const token = withdrawToken === 'WETH' ? WETH : USDC
        const decimals = withdrawToken === 'USDC' ? 6 : 18
        const amount = BigInt(Math.floor(parseFloat(amt) * (10 ** decimals)))
        writeContract({ account: address, address: vaults[0] as `0x${string}`, abi: vaultAbi, functionName: 'withdraw',
          args: [token, amount], chain: baseSepolia })
      }
    } catch (e: any) {
      setError(`Withdraw failed: ${e.message}`)
      setTxStatus('')
    }
  }

  if (!address) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl font-bold mx-auto mb-6">AG</div>
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
            <p className="text-sm text-red-400/80 mt-1">You&apos;re connected to the wrong network. MoltFi runs on <strong>Base Sepolia (testnet)</strong>. No real money is involved.</p>
          </div>
          <button onClick={() => switchChain({ chainId: baseSepolia.id })}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm font-medium transition shrink-0">
            Switch to Base Sepolia
          </button>
        </div>
      )}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300">
          {error}<button onClick={() => setError('')} className="ml-2 text-red-400">×</button>
        </div>
      )}
      {txStatus && (
        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-lg p-4 text-sm text-indigo-300">
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
                className="absolute top-3 right-3 text-gray-500 hover:text-indigo-400 transition p-1.5 rounded-lg hover:bg-gray-700/50">
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

      {/* Agent connected, no vault */}
      {hasAgent && !hasVault && (
        <div className="bg-gray-900 border border-indigo-500/30 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6 p-3 bg-gray-800/50 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">
              {agents[0].agentName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-sm">{agents[0].agentName}</div>
              <div className="text-xs text-gray-500">Registered</div>
            </div>
            <div className="ml-auto text-xs text-green-400">● Connected</div>
          </div>
          <p className="text-gray-400 text-sm text-center mb-4">Vault creation is in progress. If it didn&apos;t complete, ask your agent to say &quot;create a vault&quot;.</p>
        </div>
      )}

      {/* Vault active */}
      {hasVault && (
        <>
          {/* Vault — single combined section */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            {(() => {
              const weth = parseFloat(vaultData?.balances?.WETH || '0')
              const usdc = parseFloat(vaultData?.balances?.USDC || '0')
              const eth = parseFloat(vaultData?.balances?.ETH || '0')
              const price = ethPrice || 0
              const totalEth = eth + weth
              const totalUsd = price ? (totalEth * price + usdc) : 0

              return (
                <div className="space-y-5">
                  {/* Header with vault links */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Your Vault</h2>
                    <a href={`https://sepolia.basescan.org/address/${vaults[0]}`} target="_blank" rel="noopener"
                      className="text-xs font-mono text-indigo-400 hover:underline">{(vaults[0] as string).slice(0, 6)}...{(vaults[0] as string).slice(-4)}</a>
                  </div>

                  {/* Access */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                      <span className="text-gray-500">Your wallet</span>
                      <a href={`https://sepolia.basescan.org/address/${address}`} target="_blank" rel="noopener"
                        className="font-mono text-indigo-400 hover:underline">{address?.slice(0, 6)}...{address?.slice(-4)}</a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-gray-500">Managed by MoltFi</span>
                    </div>
                  </div>

                  {/* Balance hero */}
                  <div className="bg-gray-800/50 rounded-lg p-5">
                    <div className="text-xs text-gray-500 mb-1">Total Balance</div>
                    <div className="text-3xl font-bold">{totalEth > 0 || usdc > 0 ? `${totalEth.toFixed(4)} ETH` : '—'}</div>
                    {usdc > 0 && <div className="text-lg text-gray-400 mt-0.5">+ {usdc.toFixed(2)} USDC</div>}
                    {totalUsd > 0 && <div className="text-sm text-gray-500 mt-1">≈ ${totalUsd.toFixed(2)}</div>}
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      {totalEth > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-indigo-600" />
                          <span className="text-gray-400">{eth.toFixed(4)} ETH + {weth.toFixed(4)} WETH</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Market snapshot */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">ETH Price</div>
                      <div className="text-lg font-bold">{ethPrice ? `$${ethPrice.toLocaleString()}` : '—'}</div>
                      {rates?.prices?.eth24hChange != null && (
                        <div className={`text-xs ${rates.prices.eth24hChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {rates.prices.eth24hChange >= 0 ? '+' : ''}{rates.prices.eth24hChange.toFixed(2)}% 24h
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">Lido APR</div>
                      <div className="text-lg font-bold">{rates?.lido ? `${rates.lido.smaApr.toFixed(2)}%` : '—'}</div>
                      <div className="text-xs text-gray-600">staking rate</div>
                    </div>
                  </div>

                  {/* Guardrails */}
                  {vaultData?.policy?.active ? (
                    <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs text-gray-500">Max per trade</div>
                          <div className="text-lg font-bold">{vaultData.policy.maxPerAction} ETH</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Daily limit</div>
                          <div className="text-lg font-bold">{vaultData.policy.dailyLimit} ETH</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Used today</div>
                          <div className="text-lg font-bold">{vaultData.policy.dailySpent} ETH</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Remaining</div>
                          <div className="text-lg font-bold text-green-400">{vaultData.policy.remaining} ETH</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-800/50 text-xs">
                        <span className="text-gray-600">
                          Enforced by <a href="https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc#readContract" target="_blank" rel="noopener" className="text-indigo-400 hover:underline">AgentPolicy</a> — any trade exceeding limits reverts on-chain
                        </span>
                        <a href="/strategy" className="text-indigo-400 hover:underline shrink-0 ml-2">Change limits →</a>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/30 border border-yellow-500/20 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-yellow-400">No guardrails set</div>
                          <div className="text-xs text-gray-500 mt-1">The agent cannot trade until limits are configured.</div>
                        </div>
                        <a href="/strategy" className="text-xs text-indigo-400 hover:underline">Set limits →</a>
                      </div>
                    </div>
                  )}

                  {/* Deposit */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-gray-800/50">
                    <div>
                      <div className="text-xs text-gray-500 mb-2 font-medium">Deposit</div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                            step="0.001" min="0" placeholder="0.01"
                            className="w-full bg-gray-800 border border-gray-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 pr-12" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">ETH</span>
                        </div>
                        <button onClick={depositETH}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition">
                          Deposit
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 mt-1.5">ETH becomes vault principal — agent can only trade yield above it.</p>
                    </div>
                    <div>
                <div className="text-xs text-gray-500 mb-2 font-medium">Withdraw</div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                      step="0.001" min="0" placeholder="0.01"
                      className="w-full bg-gray-800 border border-gray-800 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-500 pr-16" />
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
                        <a href="/activity" className="text-xs text-indigo-400 hover:underline">View all →</a>
                      </div>
                      {activity.map((a, i) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1.5">
                          <span className="text-gray-400">{a.summary}</span>
                          <a href={`https://sepolia.basescan.org/tx/${a.txHash}`} target="_blank" rel="noopener"
                            className="text-indigo-400 hover:underline font-mono shrink-0 ml-2">{a.txHash.slice(0, 8)}…</a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* How deposits work */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-3">How Deposits Work</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-sm font-medium text-indigo-400 mb-2">For Humans (you)</div>
                <p className="text-xs text-gray-400">Use the deposit button above. Your wallet signs the transaction and ETH goes directly into the vault smart contract on Base. The vault tracks your principal — your agent can never touch the original deposit, only yield earned above it.</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="text-sm font-medium text-green-400 mb-2">For AI Agents</div>
                <pre className="text-xs font-mono text-gray-300 bg-gray-900/80 rounded p-2 overflow-x-auto mb-2">POST /api/vault/deposit{'\n'}{JSON.stringify({ amount: "0.01" })}</pre>
                <p className="text-xs text-gray-500">MoltFi handles signing and broadcasting. See the <a href="https://github.com/ortegarod/moltfi/blob/main/skill/SKILL.md#3-deposit-eth" className="text-indigo-400 hover:underline">full skill reference</a> for all endpoints.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
