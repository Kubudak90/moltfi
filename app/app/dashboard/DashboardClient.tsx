'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
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
] as const

export default function DashboardClient() {
  const { address } = useAccount()
  const { agents, vaults, vaultData, hasAgent, hasVault, ethPrice, refreshVaults } = useAgentContext()
  const [depositAmount, setDepositAmount] = useState('0.01')
  const [txStatus, setTxStatus] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const { writeContract, data: txHash } = useWriteContract()
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  if (txConfirmed && txStatus) {
    setTimeout(() => { setTxStatus(''); refreshVaults() }, 1500)
  }

  const createVault = () => {
    if (!agents[0]) return
    setTxStatus('Creating vault...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'createVault',
      args: [agents[0].agentWallet as `0x${string}`, parseEther('1'), parseEther('5'), [WETH, USDC]], chain: baseSepolia })
  }

  const depositETH = () => {
    if (!vaults[0]) return
    setTxStatus('Depositing ETH...')
    writeContract({ account: address, address: vaults[0] as `0x${string}`, abi: vaultAbi, functionName: 'depositETH',
      value: parseEther(depositAmount), chain: baseSepolia })
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
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300">
          {error}<button onClick={() => setError('')} className="ml-2 text-red-400">×</button>
        </div>
      )}
      {txStatus && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-sm text-indigo-300">
          {txConfirmed ? '✓ Transaction confirmed!' : txStatus}
        </div>
      )}

      {/* No agent yet */}
      {!hasAgent && (() => {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        return (
          <div className="bg-gray-900 border border-yellow-500/30 rounded-xl p-8">
            <h2 className="text-xl font-bold mb-2 text-center">Connect Your Agent</h2>
            <p className="text-gray-400 mb-6 text-center text-sm">Copy this and send it to your AI agent.</p>
            <div className="bg-gray-800/50 rounded-lg p-4 relative group cursor-pointer" onClick={() => {
              const txt = `Register with AgentGuard as my agent. My wallet: ${address}\n\ncurl -X POST ${origin}/api/agent/register -H "Content-Type: application/json" -d '{"agentWallet": "YOUR_WALLET", "humanWallet": "${address}", "agentName": "YOUR_NAME"}'`
              navigator.clipboard?.writeText(txt).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
            }}>
              <div className="absolute top-3 right-3 text-gray-500 group-hover:text-indigo-400">
                {copied ? <span className="text-green-400 text-xs">Copied!</span> : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
              </div>
              <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap pr-8">{`Register with AgentGuard as my agent.\nMy wallet: ${address}`}</pre>
              <p className="text-xs text-gray-500 mt-3">Click to copy · Paste to your agent</p>
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
              <div className="text-xs text-gray-500 font-mono">{agents[0].agentWallet.slice(0, 10)}...{agents[0].agentWallet.slice(-8)}</div>
            </div>
            <div className="ml-auto text-xs text-green-400">● Connected</div>
          </div>
          <button onClick={createVault}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-lg font-medium transition text-lg mb-2">
            Create Vault
          </button>
          <div className="flex items-start gap-2 bg-gray-800/30 rounded-lg p-3">
            <svg className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-400">
              Deploys a smart contract on Base. Your wallet will ask to confirm — network fee ~$0.03.
            </p>
          </div>
        </div>
      )}

      {/* Vault active */}
      {hasVault && (
        <>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            {/* Vault identity — prominent */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3">Your Vault</h2>
              <div className="bg-gray-800/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Vault Contract</div>
                  <a href={`https://sepolia.basescan.org/address/${vaults[0]}`} target="_blank" rel="noopener"
                    className="text-xs text-indigo-400 hover:underline">View on Basescan →</a>
                </div>
                <div className="font-mono text-sm text-white break-all">{vaults[0]}</div>

                <div className="border-t border-gray-700 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Owner</div>
                    <div className="font-mono text-sm text-white break-all">{address}</div>
                  </div>
                </div>

                {hasAgent && (
                  <div className="border-t border-gray-700 pt-3 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Agent</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-sm text-white">{agents[0].agentName}</span>
                        <span className="text-xs text-gray-500 font-mono">{agents[0].agentWallet}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">This is your money. Only your wallet can withdraw funds or change guardrails.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-5">
                <div className="text-xs text-gray-500 mb-1">WETH Balance</div>
                <div className="text-2xl font-bold">{vaultData?.balances?.WETH || '0'}</div>
                {ethPrice && vaultData?.balances?.WETH && (
                  <div className="text-xs text-gray-500 mt-1">≈ ${(parseFloat(vaultData.balances.WETH) * ethPrice).toFixed(2)}</div>
                )}
              </div>
              <div className="bg-gray-800/50 rounded-lg p-5">
                <div className="text-xs text-gray-500 mb-1">USDC Balance</div>
                <div className="text-2xl font-bold">{vaultData?.balances?.USDC || '0'}</div>
              </div>
            </div>

            {/* Human deposit */}
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2 font-medium">Deposit from your wallet</div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                    step="0.001" min="0" placeholder="0.01"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 pr-14" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">ETH</span>
                </div>
                <button onClick={depositETH}
                  className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2.5 rounded-lg text-sm font-medium transition">
                  Deposit
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">Your wallet will ask to confirm. Deposited ETH becomes the vault&apos;s principal — your agent can only trade yield above this amount.</p>
            </div>
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
                <p className="text-xs text-gray-500">AgentGuard handles signing and broadcasting. See the <a href="https://github.com/ortegarod/agentguard/blob/main/skill/SKILL.md#3-deposit-eth" className="text-indigo-400 hover:underline">full skill reference</a> for all endpoints.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
