'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px] -z-10" />

        <div className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm text-indigo-300">Live on Base · Powered by Venice AI</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Your agent moves your money.<br />
            <span className="text-indigo-400">Can you trust it?</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            AgentGuard gives your AI agent DeFi superpowers — with blockchain-enforced limits it can never exceed and private strategy analysis that never leaks your data.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg text-lg font-medium transition">
              Open Dashboard
            </Link>
            <a href="https://github.com/ortegarod/agentguard" target="_blank" rel="noopener"
              className="border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-lg text-lg font-medium transition">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center">The Problem</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-red-400 text-sm font-medium mb-3">No spending controls</div>
            <p className="text-gray-400 text-sm">
              Your agent moves money on your behalf — but there&apos;s no transparent way to scope what it can spend, verify it spent correctly, or guarantee settlement without a middleman.
            </p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="text-red-400 text-sm font-medium mb-3">Your data leaks everywhere</div>
            <p className="text-gray-400 text-sm">
              Every API call, every payment, every interaction creates metadata about you. Spending patterns, contacts, preferences. The agent isn&apos;t leaking its data — it&apos;s leaking yours.
            </p>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center">The Solution</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">On-Chain Guardrails</h3>
            <p className="text-sm text-gray-400">
              Smart contracts on Base enforce your limits on every trade. Max trade size, daily volume cap, approved tokens. Your agent physically cannot exceed them — the blockchain reverts the transaction.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Private AI Strategy</h3>
            <p className="text-sm text-gray-400">
              Your agent analyzes DeFi protocols and builds strategies using Venice&apos;s zero-retention inference. Your financial data never gets stored, logged, or used for training. Private by default.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Full Audit Trail</h3>
            <p className="text-sm text-gray-400">
              Every action your agent takes is logged with reasoning and a transaction hash you can verify on Basescan. You always know what happened and why.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
        <div className="space-y-4 max-w-2xl mx-auto">
          {[
            { step: '1', title: 'Your agent connects', desc: 'Your AI agent registers itself on AgentGuard. It knows its own wallet — no copy-pasting addresses.' },
            { step: '2', title: 'You set the rules', desc: 'On the dashboard, you choose which DeFi protocols your agent can use and set your spending limits. These get written to a smart contract on Base.' },
            { step: '3', title: 'Your agent proposes strategies', desc: 'Using Venice\'s private inference, your agent analyzes current yields and conditions across your enabled protocols. It presents you with strategy options — in plain language, not DeFi jargon.' },
            { step: '4', title: 'You pick, it executes', desc: 'Choose a strategy. Your agent executes within your guardrails — every trade goes through the AgentGuard smart contract before reaching Uniswap or any protocol. If it exceeds your limits, the transaction reverts.' },
            { step: '5', title: 'You monitor everything', desc: 'Watch your agent work on the dashboard. Every action logged with reasoning. Ask it questions anytime through the chat. Change your strategy or limits whenever you want.' },
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

      {/* Tech Stack */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center">Built With</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Uniswap V3', desc: 'Trade execution via AgentGuardRouter', color: 'border-pink-500/30' },
            { name: 'Venice AI', desc: 'Zero-retention private inference', color: 'border-purple-500/30' },
            { name: 'Lido', desc: 'ETH staking yields', color: 'border-blue-500/30' },
            { name: 'Base', desc: 'Smart contract deployment', color: 'border-blue-400/30' },
            { name: 'ENS', desc: 'Agent identity resolution', color: 'border-cyan-500/30' },
            { name: 'Celo', desc: 'Multi-chain stablecoin data', color: 'border-green-500/30' },
            { name: 'OpenClaw', desc: 'Agent runtime & harness', color: 'border-orange-500/30' },
            { name: 'ERC-8004', desc: 'On-chain agent identity', color: 'border-yellow-500/30' },
          ].map(item => (
            <div key={item.name} className={`bg-gray-900 border ${item.color} rounded-xl p-4`}>
              <div className="font-medium text-sm">{item.name}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Verified On-Chain */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-lg mb-3">Verified On-Chain</h3>
          <p className="text-sm text-gray-400 mb-4">
            AgentGuard is deployed on Base Sepolia with a verified swap through the guardrail contract.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center text-xs">
            <a href="https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              AgentPolicy Contract →
            </a>
            <a href="https://sepolia.basescan.org/address/0x5Cc04847CE5A81319b55D34F9fB757465D3677E6"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              AgentGuardRouter Contract →
            </a>
            <a href="https://sepolia.basescan.org/tx/0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              Verified Swap TX →
            </a>
          </div>
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
