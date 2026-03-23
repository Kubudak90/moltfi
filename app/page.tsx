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
            Scoped access for<br />
            <span className="text-indigo-400">AI agent trading.</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Give your AI agent an API key to trade crypto — with on-chain guardrails that it physically cannot bypass. You set the limits. Smart contracts enforce them. You withdraw anytime.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link href="/dashboard"
              className="bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg text-lg font-medium transition">
              Open Dashboard
            </Link>
            <a href="https://github.com/ortegarod/moltfi" target="_blank" rel="noopener"
              className="border border-gray-800 hover:border-gray-500 px-8 py-3 rounded-lg text-lg font-medium transition">
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="bg-gray-900 border border-red-500/20 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">The Problem</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="space-y-3">
              <h3 className="text-red-400 font-medium">Custodial wallets (Bankr, etc.)</h3>
              <p className="text-sm text-gray-400">You hand your funds to a third party. They hold the keys. No spending limits. If the agent goes rogue or the service gets compromised — there&apos;s nothing stopping it from draining everything.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-red-400 font-medium">Software-level guardrails</h3>
              <p className="text-sm text-gray-400">Limits live in the agent&apos;s code. A bug, a prompt injection, or a bad model update can bypass them. The guardrails are only as strong as the code that runs them — and that code can change.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 border border-green-500/20 rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">The MoltFi Solution</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-6">
            Your agent gets an API key with <strong className="text-white">scoped access</strong> — it can only do what you allow. The limits are enforced by smart contracts on Base, not by the agent&apos;s code. You own the vault, you set the rules, you withdraw anytime.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="text-center p-4">
              <div className="text-2xl mb-2">🔑</div>
              <div className="text-sm font-medium mb-1">Agent gets an API key</div>
              <div className="text-xs text-gray-500">Not a private key. Scoped access only.</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">⛓️</div>
              <div className="text-sm font-medium mb-1">Limits live on-chain</div>
              <div className="text-xs text-gray-500">Smart contracts enforce every trade. No bypassing.</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl mb-2">👤</div>
              <div className="text-sm font-medium mb-1">You stay in control</div>
              <div className="text-xs text-gray-500">Your wallet owns the vault. Withdraw anytime.</div>
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
              <div className="text-xs text-gray-500">API key + trade request</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-yellow-400 mb-1">MoltFi API</div>
              <div className="text-xs text-gray-500">Scoped access layer</div>
            </div>
            <div className="text-gray-600 px-2">→</div>
            <div className="flex-1">
              <div className="text-sm font-medium text-green-400 mb-1">Smart Contract</div>
              <div className="text-xs text-gray-500">Enforces your limits</div>
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
            { step: '1', title: 'You connect your wallet and create a vault', desc: 'You deposit funds and set spending limits — max trade size, daily volume cap, which tokens are allowed. These limits get written to a smart contract on Base.' },
            { step: '2', title: 'Your agent gets a scoped API key', desc: 'Your agent registers and gets an API key. This key lets it trade within your vault — but only within your limits. No private keys, no direct blockchain access.' },
            { step: '3', title: 'Your agent trades with plain English', desc: '"Swap 0.01 WETH to USDC." MoltFi processes the request, then the smart contract checks it against your limits before any funds move.' },
            { step: '4', title: 'Smart contracts enforce every limit', desc: 'Within limits → trade executes on Uniswap V3. Over limits → transaction reverts automatically. Every trade has a Basescan link. The agent physically cannot exceed your guardrails.' },
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

      {/* Scoped Access — What the API key can and can't do */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-3 text-center">Scoped Access</h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          The API key is the guardrail. Here&apos;s exactly what your agent can and can&apos;t do.
        </p>
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="bg-gray-900 border border-green-500/20 rounded-xl p-5">
            <h3 className="text-green-400 font-medium text-sm mb-3">Agent CAN</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Trade within your per-trade limit</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Trade within your daily spending cap</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Swap only your approved tokens</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Check vault balance and status</li>
              <li className="flex items-start gap-2"><span className="text-green-400 mt-0.5">✓</span> Request strategy suggestions (Venice AI)</li>
            </ul>
          </div>
          <div className="bg-gray-900 border border-red-500/20 rounded-xl p-5">
            <h3 className="text-red-400 font-medium text-sm mb-3">Agent CANNOT</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span> Withdraw funds (owner-only)</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span> Change the guardrail limits</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span> Trade unapproved tokens</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span> Exceed per-trade or daily limits</li>
              <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">✗</span> Access private keys</li>
            </ul>
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center mt-4 max-w-lg mx-auto">
          Why on-chain? Because you shouldn&apos;t have to trust someone&apos;s server to enforce your limits. The smart contract doesn&apos;t care who calls it — if the trade exceeds your limits, it reverts. Period.
        </p>
      </section>

      {/* Agent Integration */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-3 text-center">Works With Any Agent</h2>
        <p className="text-gray-500 text-center mb-8 max-w-2xl mx-auto">
          If your agent can make HTTP calls, it can use MoltFi. No SDK, no blockchain knowledge required.
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
