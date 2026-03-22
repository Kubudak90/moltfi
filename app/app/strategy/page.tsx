'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { baseSepolia } from 'viem/chains'
import { useAgentContext } from '../components/AgentContext'

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774' as const

const factoryAbi = [
  { name: 'updatePolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }, { name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }], outputs: [] },
  { name: 'revokePolicy', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'vault', type: 'address' }], outputs: [] },
] as const

type Strategy = {
  name: string; description: string; expectedYield: string
  steps: string[]
  guardrails: { maxTradeSize: string; dailyLimit: string; maxSlippage: string; protocols: string[] }
}

export default function StrategyPage() {
  const { address } = useAccount()
  const { vaults, vaultData, rates, hasVault } = useAgentContext()
  const [strategies, setStrategies] = useState<Strategy[]>([])
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [active, setActive] = useState<Strategy | null>(null)
  const [txStatus, setTxStatus] = useState('')

  const { writeContract, data: txHash } = useWriteContract()
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash })

  const generate = async () => {
    setGenerating(true); setStrategies([]); setSelected(null)
    try {
      const balance = vaultData?.balances?.WETH || '0'
      const usdcBalance = vaultData?.balances?.USDC || '0'
      const lidoApr = rates?.lido ? `${rates.lido.smaApr.toFixed(2)}%` : 'unknown'
      const ep = rates?.prices?.eth ? `$${rates.prices.eth.toLocaleString()}` : 'unknown'
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user',
          content: `You are an autonomous AI DeFi agent for AgentGuard on Base. The user has a vault with ${balance} WETH and ${usdcBalance} USDC. Current data: ETH price ${ep}, Lido stETH APR ${lidoApr}.

Available protocols: Lido (ETH staking), Uniswap V3 (swaps), Aave (lending/borrowing), Compound (lending).

Generate exactly 3 strategies that YOU will execute autonomously. Once approved, you run continuously — checking yields, rebalancing, making trades. Guardrails enforced on-chain.

Plain English — the user knows nothing about DeFi.

Return EXACTLY this format for each, no other text:

\`\`\`strategy
{
  "name": "Strategy Name",
  "description": "What I'll do with your money, plain English",
  "expectedYield": "X-Y% APR",
  "steps": ["What I'll actively do", "What I'll monitor"],
  "guardrails": {
    "maxTradeSize": "0.5 ETH",
    "dailyLimit": "2 ETH",
    "maxSlippage": "1%",
    "protocols": ["Lido", "Uniswap V3"]
  }
}
\`\`\`

Strategy 1: Safe. Strategy 2: Balanced. Strategy 3: Aggressive.` }] }) })
      const data = await res.json()
      if (data.reply) {
        const parsed: Strategy[] = []
        for (const match of data.reply.matchAll(/```strategy\n([\s\S]*?)\n```/g)) {
          try { parsed.push(JSON.parse(match[1])) } catch {}
        }
        setStrategies(parsed)
      }
    } catch {}
    setGenerating(false)
  }

  const deploy = (s: Strategy) => {
    if (!vaults[0]) return
    setTxStatus('Setting guardrails on-chain...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'updatePolicy',
      args: [vaults[0] as `0x${string}`, parseEther(s.guardrails.maxTradeSize.replace(' ETH', '')),
        parseEther(s.guardrails.dailyLimit.replace(' ETH', ''))], chain: baseSepolia })
    setActive(s)
  }

  const pause = () => {
    if (!vaults[0]) return
    setTxStatus('Pausing agent...')
    writeContract({ account: address, address: VAULT_FACTORY, abi: factoryAbi, functionName: 'revokePolicy',
      args: [vaults[0] as `0x${string}`], chain: baseSepolia })
    setActive(null)
  }

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to view strategies.</div>
  if (!hasVault) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Create a vault first in the Vault tab.</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {txStatus && (
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-sm text-indigo-300">
          {txConfirmed ? '✓ Confirmed!' : txStatus}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Strategy</h1>
          <p className="text-sm text-gray-500">Approve a strategy — your agent runs autonomously within on-chain guardrails</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-purple-400">
          <div className="w-2 h-2 rounded-full bg-purple-400" />Venice AI
        </div>
      </div>

      {/* Active strategy */}
      {active && (
        <div className="p-6 bg-green-500/5 border border-green-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="font-semibold text-green-400">Agent Running</span>
            </div>
            <span className="text-xs text-green-300/70">{active.expectedYield}</span>
          </div>
          <div className="font-medium text-lg mb-1">{active.name}</div>
          <p className="text-sm text-gray-400 mb-4">{active.description}</p>
          <div className="bg-gray-800/40 rounded-lg p-4 mb-4">
            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">What the agent is doing</div>
            {active.steps?.map((step, j) => (
              <div key={j} className="flex items-start gap-2 text-sm mb-1.5">
                <span className="text-green-400 shrink-0">→</span>
                <span className="text-gray-300">{step}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-4">
            <div className="bg-gray-800/50 rounded-lg p-2"><span className="text-gray-500">Max trade: </span><span className="text-gray-300">{active.guardrails.maxTradeSize}</span></div>
            <div className="bg-gray-800/50 rounded-lg p-2"><span className="text-gray-500">Daily limit: </span><span className="text-gray-300">{active.guardrails.dailyLimit}</span></div>
            <div className="bg-gray-800/50 rounded-lg p-2"><span className="text-gray-500">Slippage: </span><span className="text-gray-300">{active.guardrails.maxSlippage}</span></div>
            <div className="bg-gray-800/50 rounded-lg p-2"><span className="text-gray-500">Protocols: </span><span className="text-gray-300">{active.guardrails.protocols.join(', ')}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setActive(null); setStrategies([]); setSelected(null) }}
              className="text-sm text-gray-500 hover:text-gray-300">Change Strategy</button>
            <button onClick={pause}
              className="ml-auto bg-red-600/20 hover:bg-red-600/40 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 transition text-sm font-medium">
              Pause Agent
            </button>
          </div>
        </div>
      )}

      {/* Generate */}
      {!active && strategies.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-400 mb-6">
            {generating ? 'Analyzing protocols, yields, and market conditions...'
              : 'Your agent will analyze current market conditions and propose strategies.'}
          </p>
          <button onClick={generate} disabled={generating}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 px-8 py-3 rounded-lg font-medium transition text-lg">
            {generating ? (
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Analyzing...
              </span>
            ) : 'Show Me Strategies'}
          </button>
        </div>
      )}

      {/* Strategy cards */}
      {!active && strategies.length > 0 && (
        <div className="space-y-4">
          {strategies.map((s, i) => (
            <button key={i} onClick={() => setSelected(i)}
              className={`w-full text-left border rounded-xl p-6 transition ${selected === i ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-800 hover:border-gray-700 bg-gray-900'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-lg">{s.name}</span>
                <span className="text-sm text-indigo-400 font-medium">{s.expectedYield}</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">{s.description}</p>
              <div className="space-y-2 mb-4">
                {s.steps?.map((step, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-indigo-400 mt-0.5 shrink-0">{j + 1}.</span>
                    <span className="text-gray-300">{step}</span>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3 border-t border-gray-800/50">
                <div><span className="text-gray-600">Max trade: </span><span className="text-gray-400">{s.guardrails.maxTradeSize}</span></div>
                <div><span className="text-gray-600">Daily limit: </span><span className="text-gray-400">{s.guardrails.dailyLimit}</span></div>
                <div><span className="text-gray-600">Slippage: </span><span className="text-gray-400">{s.guardrails.maxSlippage}</span></div>
                <div><span className="text-gray-600">Protocols: </span><span className="text-gray-400">{s.guardrails.protocols.join(', ')}</span></div>
              </div>
              {selected === i && (
                <div className="mt-4 pt-4 border-t border-indigo-500/30 flex justify-between items-center">
                  <span className="text-xs text-indigo-300">Guardrails enforced on-chain via smart contract</span>
                  <div onClick={(e) => { e.stopPropagation(); deploy(s) }}
                    className="bg-green-600 hover:bg-green-500 px-6 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer">
                    Approve &amp; Start Agent
                  </div>
                </div>
              )}
            </button>
          ))}
          <button onClick={generate} disabled={generating}
            className="text-sm text-gray-500 hover:text-gray-300 transition">Regenerate strategies</button>
        </div>
      )}

      {/* How strategies work */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold mb-3">How Strategies Work</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            <span><strong className="text-gray-300">AI analyzes markets</strong> — Venice AI checks current ETH price, Lido staking yields, gas costs, and your vault balance. Analysis is private — zero data retention.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">2.</span>
            <span><strong className="text-gray-300">AI proposes strategies with guardrails</strong> — each strategy comes with built-in limits (max trade size, daily cap). You don&apos;t need to configure anything technical.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">3.</span>
            <span><strong className="text-gray-300">You pick one</strong> — &quot;Approve &amp; Start Agent&quot; writes the guardrails to a smart contract on Base. These limits are now on-chain.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">4.</span>
            <span><strong className="text-gray-300">Agent runs autonomously</strong> — it checks markets every 30 minutes, rebalances, and trades within your guardrails. If it tries to exceed them, the blockchain reverts the transaction.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">5.</span>
            <span><strong className="text-gray-300">Pause anytime</strong> — one click revokes the agent&apos;s policy on-chain. It can&apos;t trade until you re-enable it.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
