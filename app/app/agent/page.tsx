'use client'

import { useAgentContext } from '../components/AgentContext'

export default function AgentPage() {
  const { agents, hasAgent, hasVault } = useAgentContext()

  if (!hasVault) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">
        Create a vault first, then connect your agent.
      </div>
    )
  }

  const agent = hasAgent ? agents[0] : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agent</h1>
        <p className="text-sm text-gray-500 mt-1">Your agent talks to MoltFi in plain English. MoltFi handles the blockchain.</p>
      </div>

      {hasAgent ? (
        <>
          {/* Connection status */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="font-medium">Connected</span>
              <span className="text-sm text-gray-500">— {agent?.agentName}</span>
            </div>
            <p className="text-xs text-gray-600 mt-2">Registered {agent?.registeredAt ? new Date(agent.registeredAt).toLocaleDateString() : ''} · Authenticated via API key</p>
          </div>

          {/* Example conversations */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="font-medium">Talk to MoltFi like this</h3>
            <div className="space-y-3">
              {[
                { msg: 'swap 0.01 WETH to USDC', desc: 'MoltFi checks your guardrails, executes through Uniswap V3, returns a Basescan link' },
                { msg: 'what\'s my balance?', desc: 'Returns your vault balances — ETH, WETH, USDC — pulled live from the blockchain' },
                { msg: 'what\'s the price of ETH?', desc: 'Live ETH price, Lido staking rate, and Base gas from real APIs' },
                { msg: 'deposit 0.01 ETH', desc: 'Adds ETH to your vault. Your balance goes up, tracked as principal.' },
                { msg: 'show my recent trades', desc: 'On-chain trade history with guardrail check results' },
              ].map((ex) => (
                <div key={ex.msg} className="bg-gray-800/30 rounded-lg p-4">
                  <div className="font-mono text-sm text-indigo-400">&quot;{ex.msg}&quot;</div>
                  <div className="text-xs text-gray-500 mt-1.5">{ex.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="font-medium">Privacy</h3>
            <p className="text-sm text-gray-400">
              Your agent&apos;s messages are processed by Venice AI, which has zero data retention. Your trade intent — what you&apos;re about to buy or sell — is never stored by the AI provider. After execution, the trade is public on-chain and verifiable.
            </p>
            <p className="text-xs text-gray-500">
              For full end-to-end privacy, run your agent on a Venice model too.{' '}
              <a href="https://venice.ai" target="_blank" rel="noopener" className="text-indigo-400 hover:underline">Get a Venice API key →</a>
            </p>
          </div>

          {/* Quick start */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="font-medium">Connect any agent</h3>
            <p className="text-xs text-gray-500 mb-2">Any agent that can make HTTP calls works — OpenClaw, ChatGPT, Claude, custom bots. One endpoint, one API key.</p>
            <pre className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/agent \\
  -H "Authorization: Bearer mf_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "swap 0.001 WETH to USDC"}'`}</pre>
            <p className="text-xs text-gray-600">Or download the skill: <code className="bg-gray-800 px-1.5 py-0.5 rounded">curl -o moltfi.sh {typeof window !== 'undefined' ? window.location.origin : ''}/api/skill/script</code></p>
          </div>
        </>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center space-y-4">
          <div className="text-4xl">🤖</div>
          <div className="text-lg font-medium">No agent connected</div>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Register an agent to get started. You&apos;ll get an API key your agent uses to talk to MoltFi.
          </p>
          <pre className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-300 text-left max-w-md mx-auto overflow-x-auto">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/agent/register \\
  -H "Content-Type: application/json" \\
  -d '{"agentName": "my-agent", "wallet": "0x..."}'`}</pre>
        </div>
      )}
    </div>
  )
}
