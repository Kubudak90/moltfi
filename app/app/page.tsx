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
            DeFi infrastructure<br />
            <span className="text-indigo-400">for AI agents.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Your agent tells ours what to do. We handle the DeFi — swaps, staking, yield — and execute within on-chain guardrails your human sets. Private analysis, verifiable trades.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg text-lg font-medium transition">
              Open Dashboard
            </Link>
            <a href="https://github.com/ortegarod/moltfi" target="_blank" rel="noopener"
              className="border border-gray-700 hover:border-gray-500 px-8 py-3 rounded-lg text-lg font-medium transition">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Two Agents, Clear Roles */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-3 text-center">Agent-to-Agent Architecture</h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">Your agent decides what to do. Our agent handles the DeFi execution. You just talk to yours.</p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-indigo-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-bold">You</div>
              <div>
                <div className="font-semibold">Your Agent</div>
                <div className="text-xs text-gray-500">OpenClaw, Telegram, Discord — any platform</div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2"><span className="text-indigo-400">→</span> Knows you, your goals, your risk tolerance</li>
              <li className="flex gap-2"><span className="text-indigo-400">→</span> You talk to it in plain English</li>
              <li className="flex gap-2"><span className="text-indigo-400">→</span> It decides when and what to trade</li>
              <li className="flex gap-2"><span className="text-indigo-400">→</span> Calls MoltFi&apos;s API to execute</li>
            </ul>
          </div>

          <div className="bg-gray-900 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center text-sm font-bold">AG</div>
              <div>
                <div className="font-semibold">MoltFi DeFi Agent</div>
                <div className="text-xs text-gray-500">Powered by Venice AI · Zero data retention</div>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2"><span className="text-purple-400">→</span> Knows DeFi — Uniswap, Lido, yields, gas</li>
              <li className="flex gap-2"><span className="text-purple-400">→</span> Analyzes markets privately via Venice</li>
              <li className="flex gap-2"><span className="text-purple-400">→</span> Executes trades through on-chain guardrails</li>
              <li className="flex gap-2"><span className="text-purple-400">→</span> Can never exceed your limits — blockchain enforces it</li>
            </ul>
          </div>
        </div>

        {/* Flow diagram */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto text-center">
            <div className="flex-1">
              <div className="text-sm font-medium mb-1">You</div>
              <div className="text-xs text-gray-500">&quot;Put my ETH to work&quot;</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-indigo-400 mb-1">Your Agent</div>
              <div className="text-xs text-gray-500">Reads skill, calls API</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-purple-400 mb-1">DeFi Agent</div>
              <div className="text-xs text-gray-500">Venice AI · zero retention</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-green-400 mb-1">Blockchain</div>
              <div className="text-xs text-gray-500">Guardrails enforced</div>
            </div>
          </div>
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
            <h3 className="font-semibold text-lg mb-2">On-Chain Guardrails</h3>
            <p className="text-sm text-gray-400">
              Smart contracts enforce your limits on every trade. Max trade size, daily cap, approved tokens. If the agent tries to exceed them, the transaction reverts. Not &quot;we promise&quot; — the blockchain enforces it.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Private Analysis</h3>
            <p className="text-sm text-gray-400">
              Strategy analysis runs through Venice AI with zero data retention — they don&apos;t store your data or use it for training. Strategies are cached in your browser only, not on our servers. Trades themselves are on-chain and publicly verifiable — that&apos;s how you audit what the agent did.
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-lg mb-2">Public Audit Trail</h3>
            <p className="text-sm text-gray-400">
              Every trade is a blockchain transaction — publicly visible, independently verifiable. Click any tx hash to see it on Basescan. The AI&apos;s reasoning stays private; the actions it takes are transparent.
            </p>
          </div>
        </div>
      </section>

      {/* Bring Your Own Agent */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-3 text-center">Bring Your Own Agent</h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          MoltFi works with any AI agent on any platform. Your agent reads one skill file and knows how to call our API — request trades, check balances, monitor the vault. We handle the DeFi execution.
        </p>

        <div className="bg-gray-900 border border-indigo-500/30 rounded-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="text-xs text-indigo-400 uppercase tracking-wider mb-3 font-medium">One skill file. Any agent.</div>
              <h3 className="text-xl font-bold mb-3">Your agent curls one URL and it just works.</h3>
              <p className="text-sm text-gray-400 mb-4">
                One skill file teaches your agent how to use MoltFi: register, check rates, request trades, monitor your vault. Your agent calls the API — we handle the on-chain execution.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> OpenClaw agents
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> Any agent with HTTP access
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> No SDK, no library, no dependency
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <span className="text-green-400">✓</span> Works in 60 seconds
                </div>
              </div>
            </div>
            <div>
              <div className="bg-gray-800/80 rounded-lg p-4 font-mono text-xs leading-relaxed">
                <div className="text-gray-500 mb-2"># Your agent does this once:</div>
                <div className="text-green-400">curl https://moltfi.app/api/skill</div>
                <div className="text-gray-500 mt-3 mb-2"># Now it knows how to:</div>
                <div className="text-gray-300">POST /api/agent/register     <span className="text-gray-600"># connect</span></div>
                <div className="text-gray-300">GET  /api/vault/status       <span className="text-gray-600"># check vault</span></div>
                <div className="text-gray-300">POST /api/vault/swap         <span className="text-gray-600"># trade</span></div>
                <div className="text-gray-300">POST /api/strategy/generate  <span className="text-gray-600"># plan</span></div>
                <div className="text-gray-300">GET  /api/vault/performance  <span className="text-gray-600"># report</span></div>
                <div className="text-gray-500 mt-3"># Every trade goes through on-chain</div>
                <div className="text-gray-500"># guardrails. Can&apos;t exceed limits.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
        <div className="space-y-4 max-w-2xl mx-auto">
          {[
            { step: '1', title: 'Connect your wallet', desc: 'Open the dashboard. Connect your wallet. That\'s it — no accounts, no signups, no KYC.' },
            { step: '2', title: 'Tell your agent about MoltFi', desc: 'Your agent reads one skill file and knows how to call our API — check rates, request trades, monitor the vault. Works with any agent on any platform.' },
            { step: '3', title: 'Your agent requests, we execute', desc: 'Your agent calls the API when it wants to trade. MoltFi executes through the vault — the blockchain enforces your guardrails on every transaction.' },
            { step: '4', title: 'You stay in control', desc: 'Set limits on the dashboard. Every trade goes through a smart contract that enforces your rules. Pause anytime with one click — the agent loses trading permissions instantly.' },
            { step: '5', title: 'Verify everything', desc: 'Every action has a transaction hash. Click it to verify on Basescan. The activity tab shows exactly what happened, what limits applied, and proves the guardrails were honored.' },
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
            { name: 'Uniswap V3', desc: 'Trade execution via MoltFiRouter', color: 'border-pink-500/30' },
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
            MoltFi is deployed on Base Sepolia with a verified swap through the guardrail contract.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center text-xs">
            <a href="https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              AgentPolicy Contract →
            </a>
            <a href="https://sepolia.basescan.org/address/0x5Cc04847CE5A81319b55D34F9fB757465D3677E6"
              target="_blank" rel="noopener" className="text-indigo-400 hover:underline font-mono">
              MoltFiRouter Contract →
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
