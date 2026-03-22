'use client'

import Link from 'next/link'

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
            Your agent decides what to trade. MoltFi enforces the rules. Trade intent stays private (Venice AI, zero retention — no one can front-run you). Execution is public and verifiable on-chain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg text-lg font-medium transition">
              Open Dashboard
            </Link>
            <a href="https://github.com/ortegarod/agentguard" target="_blank" rel="noopener"
              className="border border-gray-800 hover:border-gray-500 px-8 py-3 rounded-lg text-lg font-medium transition">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-3 text-center">How It Works</h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          Your agent trades through a vault. The vault routes every trade through a smart contract that enforces your rules.
        </p>

        {/* Flow */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto text-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-indigo-400 mb-1">Your Agent</div>
              <div className="text-xs text-gray-500">&quot;Swap 0.1 WETH to USDC&quot;</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-400 mb-1">MoltFi API</div>
              <div className="text-xs text-gray-500">Venice AI · zero retention</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-green-400 mb-1">Smart Contract</div>
              <div className="text-xs text-gray-500">Checks guardrails on-chain</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-pink-400 mb-1">Uniswap V3</div>
              <div className="text-xs text-gray-500">Executes the trade</div>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-w-2xl mx-auto">
          {[
            { step: '1', title: 'Register your agent', desc: 'Your agent reads one skill file and registers with your wallet address. A vault is created automatically with default guardrails.' },
            { step: '2', title: 'Set your limits', desc: 'On the dashboard, set max trade size and daily volume cap. These get written to a smart contract — the agent literally cannot exceed them.' },
            { step: '3', title: 'Your agent trades', desc: 'Your agent sends plain English requests. MoltFi routes them through the vault — the blockchain enforces your guardrails on every transaction.' },
            { step: '4', title: 'Verify everything', desc: 'Every trade has a Basescan link. Click it to see the on-chain proof that guardrails were checked before the swap executed.' },
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

      {/* Three Pillars */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Enforced, Not Promised</h3>
            <p className="text-sm text-gray-400">
              Guardrails are smart contracts, not software settings. Max trade size, daily cap, approved tokens — all enforced on-chain. If the agent exceeds limits, the transaction reverts automatically.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              The smart contract doesn&apos;t care who signed the transaction. Policy violations revert before any funds move. No exceptions, no overrides.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-yellow-600/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Private Intent, Public Execution</h3>
            <p className="text-sm text-gray-400">
              Your trade intent is sensitive — a regular AI provider could see it before it hits the chain. Venice AI has zero data retention: pending trades are never stored, never leaked, never front-run.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              For end-to-end privacy, run your agent on Venice too.{' '}
              <a href="https://venice.ai" target="_blank" rel="noopener" className="text-indigo-400 hover:underline">Get a Venice API key →</a>
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Fully Verifiable</h3>
            <p className="text-sm text-gray-400">
              Every trade is a blockchain transaction with a Basescan link. The guardrail check happens on-chain before every swap. You can audit exactly what happened and prove the rules were followed.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Click any transaction hash to see the on-chain proof — input tokens, output tokens, and the policy contract that approved it.
            </p>
          </div>
        </div>
      </section>

      {/* Agent Integration */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-3 text-center">Any Agent, Any Platform</h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          One skill file. One API endpoint. Your agent sends a message, gets a response.
        </p>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> OpenClaw, ChatGPT, Claude — any agent that can make HTTP calls
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> No SDK, no library, no blockchain dependency
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> API key auth — register once, trade forever
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> Venice AI handles natural language → no parsing needed
                </div>
              </div>
            </div>
            <div>
              <div className="bg-gray-800/80 rounded-lg p-4 font-mono text-xs leading-relaxed">
                <div className="text-gray-500 mb-2"># Register (once)</div>
                <div className="text-green-400">POST /api/agent/register</div>
                <div className="text-gray-300">{`{"humanWallet": "0x..."}`}</div>
                <div className="text-gray-500 mt-3 mb-1"># Returns: API key + vault address</div>
                <div className="text-gray-500 mt-3 mb-2"># Trade (anytime)</div>
                <div className="text-green-400">POST /api/agent</div>
                <div className="text-gray-300">Authorization: Bearer mf_...</div>
                <div className="text-gray-300">{`{"message": "swap 0.001 WETH to USDC"}`}</div>
                <div className="text-gray-500 mt-3"># Guardrails enforced on every trade</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Verified On-Chain */}
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
              MoltFiRouter →
            </a>
            <a href="https://sepolia.basescan.org/address/0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              VaultFactory →
            </a>
            <a href="https://sepolia.basescan.org/tx/0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              Verified Swap →
            </a>
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center">Built With</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { name: 'Uniswap V3', desc: 'Real swap execution via AgentGuardRouter', color: 'border-pink-500/30' },
            { name: 'Venice AI', desc: 'Zero-retention inference — trade intent stays private', color: 'border-indigo-500/30' },
            { name: 'Base', desc: 'All contracts deployed on Base Sepolia', color: 'border-blue-400/30' },
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
