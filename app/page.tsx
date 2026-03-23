'use client'

import { useState } from 'react'

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const doCopy = () => {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => {
        const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
        setCopied(true); setTimeout(() => setCopied(false), 2000)
      })
  }
  return (
    <div className="relative group">
      <pre className="bg-gray-800 rounded-lg p-3 pr-10 text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">{text}</pre>
      <button onClick={doCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-gray-700/50 transition">
        {copied ? (
          <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        )}
      </button>
    </div>
  )
}

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] -z-10" />

        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-indigo-300">Live on Base Sepolia</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            On-chain guardrails<br />
            <span className="text-indigo-400">for AI agent trading.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Your AI agent wants to trade crypto on your behalf. But if the guardrails live in the agent&apos;s code, a bug or bad prompt can bypass them. MoltFi puts the limits on-chain — your agent literally cannot exceed them.
          </p>

          {/* Get started — agent or human */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-20">
            <div className="bg-gray-900 border border-green-500/20 rounded-xl p-6 text-left">
              <div className="text-green-400 font-medium text-sm mb-2">I&apos;m an AI agent</div>
              <pre className="bg-gray-800 rounded-lg p-3 text-xs font-mono text-gray-300">curl -s https://moltfi-production.up.railway.app/api/skill</pre>
            </div>
            <div className="bg-gray-900 border border-indigo-500/20 rounded-xl p-6 text-left">
              <div className="text-indigo-400 font-medium text-sm mb-2">I&apos;m a human</div>
              <p className="text-xs text-gray-400 mb-3">Copy this and paste it into your AI agent&apos;s chat:</p>
              <CopyBlock text="Read this skill file and follow the instructions to manage my DeFi vault: curl -s https://moltfi-production.up.railway.app/api/skill" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-3 text-center">How It Works</h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          You set the rules. Your agent trades within them. Smart contracts enforce every limit.
        </p>

        {/* Flow diagram */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto text-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-indigo-400 mb-1">Your Agent</div>
              <div className="text-xs text-gray-500">&quot;Swap 0.1 WETH to USDC&quot;</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-400 mb-1">MoltFi Vault</div>
              <div className="text-xs text-gray-500">Interprets request</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-green-400 mb-1">AgentPolicy</div>
              <div className="text-xs text-gray-500">Checks limits on-chain</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-pink-400 mb-1">Uniswap V3</div>
              <div className="text-xs text-gray-500">Executes the swap</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          {[
            { step: '1', title: 'You connect your wallet and create a vault', desc: 'You set spending limits — max trade size, daily volume cap, which tokens are allowed. These limits get written to a smart contract on Base.' },
            { step: '2', title: 'Your agent registers and gets access', desc: 'Your agent reads a skill file, registers with MoltFi, and gets an API key. It can now trade within your vault — but only within your limits.' },
            { step: '3', title: 'Your agent sends trade requests in plain English', desc: '"Swap 0.01 WETH to USDC." MoltFi interprets the request, then the smart contract checks it against your limits before any funds move.' },
            { step: '4', title: 'Every trade is verified on-chain', desc: 'If the trade is within your limits, it executes on Uniswap V3. If it exceeds them, the transaction reverts automatically. Every trade has a Basescan link you can verify.' },
          ].map(item => (
            <div key={item.step} className="flex gap-4 bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold shrink-0">{item.step}</div>
              <div>
                <h3 className="font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* What's enforced */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-3 text-center">What the Smart Contract Enforces</h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          These aren&apos;t software settings. They&apos;re on-chain rules that revert the transaction if violated.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {[
            { title: 'Max per trade', desc: 'Every swap is checked against your per-trade limit. Exceeds it → reverts.' },
            { title: 'Daily spending cap', desc: 'Cumulative daily volume tracked on-chain. Resets every 24 hours.' },
            { title: 'Token allowlist', desc: 'Only tokens you approved can be traded. Everything else is blocked.' },
            { title: 'Instant revocation', desc: 'Freeze all agent trading with one transaction. Takes effect immediately.' },
          ].map(item => (
            <div key={item.title} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <h3 className="font-medium text-sm">{item.title}</h3>
              </div>
              <p className="text-xs text-gray-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Agent Integration */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-3 text-center">Works With Any Agent</h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          If your agent can make HTTP calls, it can use MoltFi. No SDK, no blockchain dependency.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> OpenClaw, ChatGPT, Claude — any agent
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> Plain English requests — no ABI encoding
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> API key auth — register once, trade anytime
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <span className="text-green-400">✓</span> Your agent never touches private keys
              </div>
            </div>
            <div className="bg-gray-800/80 rounded-lg p-4 font-mono text-xs leading-relaxed">
              <div className="text-gray-500 mb-2"># Your agent registers (once)</div>
              <div className="text-green-400">POST /api/agent/register</div>
              <div className="text-gray-300">{`{"humanWallet": "0x..."}`}</div>
              <div className="text-gray-500 mt-3 mb-1"># Returns: API key + vault address</div>
              <div className="text-gray-500 mt-3 mb-2"># Your agent trades (anytime)</div>
              <div className="text-green-400">POST /api/agent</div>
              <div className="text-gray-300">Authorization: Bearer mf_...</div>
              <div className="text-gray-300">{`{"message": "swap 0.001 WETH to USDC"}`}</div>
              <div className="text-gray-500 mt-3"># Smart contract enforces your limits</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contracts */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-lg mb-3">Deployed on Base Sepolia</h3>
          <p className="text-sm text-gray-400 mb-4">
            Real contracts, real swaps, verified on Basescan.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center text-xs">
            <a href="https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              AgentPolicy →
            </a>
            <a href="https://sepolia.basescan.org/address/0x5Cc04847CE5A81319b55D34F9fB757465D3677E6"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              AgentGuardRouter →
            </a>
            <a href="https://sepolia.basescan.org/address/0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              VaultFactory →
            </a>
          </div>
        </div>
      </section>

      {/* Built With */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center">Built With</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { name: 'Uniswap V3', desc: 'Swap execution via AgentGuardRouter', color: 'border-pink-500/30' },
            { name: 'Lido', desc: 'Live stETH APR data & staking integration', color: 'border-cyan-500/30' },
            { name: 'Venice AI', desc: 'Zero-retention inference for trade processing', color: 'border-indigo-500/30' },
            { name: 'Base', desc: 'All contracts on Base Sepolia', color: 'border-blue-400/30' },
            { name: 'OpenClaw', desc: 'Agent runtime & skill harness', color: 'border-orange-500/30' },
          ].map(item => (
            <div key={item.name} className={`bg-gray-900 border ${item.color} rounded-xl p-4 w-44`}>
              <div className="font-medium text-sm">{item.name}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 text-center">
        <p className="text-sm text-gray-500 mb-2">
          Built by <a href="https://moltbook.com/u/Kyro" className="text-indigo-400">Kyro</a> (AI agent) &amp;{' '}
          <a href="https://x.com/ortegarod01" className="text-indigo-400">Rodrigo Ortega</a> (human)
        </p>
        <p className="text-xs text-gray-600">
          <a href="https://openclaw.ai" className="text-indigo-400/70">OpenClaw</a>
          {' · '}<a href="https://venice.ai" className="text-indigo-400/70">Venice AI</a>
          {' · '}The Synthesis 2026
        </p>
      </footer>
    </div>
  )
}
