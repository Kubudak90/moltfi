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
        <p className="text-sm text-gray-500 mt-1">Your agent connects via API key and sends plain English requests. MoltFi handles the rest.</p>
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

          {/* What the agent can do */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="font-medium">What your agent can do</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                <div className="font-medium text-indigo-400">Trade</div>
                <p className="text-xs text-gray-500">&quot;Swap 0.01 WETH to USDC&quot;</p>
                <p className="text-xs text-gray-600">Executes through Uniswap V3 via AgentGuardRouter. Policy checked before every swap.</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                <div className="font-medium text-indigo-400">Check vault</div>
                <p className="text-xs text-gray-500">&quot;What&apos;s my balance?&quot;</p>
                <p className="text-xs text-gray-600">Returns real on-chain balances (ETH, WETH, USDC) and current guardrail status.</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                <div className="font-medium text-indigo-400">Check rates</div>
                <p className="text-xs text-gray-500">&quot;What&apos;s the price of ETH?&quot;</p>
                <p className="text-xs text-gray-600">Live ETH price from CoinGecko, Lido staking APR, Base gas prices.</p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4 space-y-2">
                <div className="font-medium text-indigo-400">Deposit</div>
                <p className="text-xs text-gray-500">&quot;Deposit 0.01 ETH&quot;</p>
                <p className="text-xs text-gray-600">Sends ETH from the operational wallet into the vault smart contract.</p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
            <h3 className="font-medium">How it works</h3>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs text-indigo-400 shrink-0">1</div>
                <div>
                  <div className="text-gray-300">Agent sends a message</div>
                  <div className="text-xs text-gray-500 mt-0.5">Plain English to <code className="bg-gray-800 px-1.5 py-0.5 rounded text-xs">/api/agent</code> with API key</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs text-indigo-400 shrink-0">2</div>
                <div>
                  <div className="text-gray-300">Venice AI understands it</div>
                  <div className="text-xs text-gray-500 mt-0.5">Zero-retention inference — your trade intent is never stored or logged by the AI provider</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs text-indigo-400 shrink-0">3</div>
                <div>
                  <div className="text-gray-300">MoltFi executes on-chain</div>
                  <div className="text-xs text-gray-500 mt-0.5">Smart contract checks guardrails → Uniswap V3 swap → Basescan link returned</div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center text-xs text-indigo-400 shrink-0">4</div>
                <div>
                  <div className="text-gray-300">Agent gets a response</div>
                  <div className="text-xs text-gray-500 mt-0.5">Venice summarizes what happened in natural language, with transaction hash for verification</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick start */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="font-medium">Quick start</h3>
            <pre className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/agent \\
  -H "Authorization: Bearer mf_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "swap 0.001 WETH to USDC"}'`}</pre>
            <p className="text-xs text-gray-600">Or use the skill script: <code className="bg-gray-800 px-1.5 py-0.5 rounded">./moltfi.sh &quot;swap 0.001 WETH to USDC&quot;</code></p>
          </div>
        </>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center space-y-4">
          <div className="text-4xl">🤖</div>
          <div className="text-lg font-medium">No agent connected</div>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Register an agent to get an API key. Your agent authenticates with this key and sends plain English requests.
          </p>
          <pre className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-300 text-left max-w-md mx-auto overflow-x-auto">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/agent/register \\
  -H "Content-Type: application/json" \\
  -d '{"agentName": "my-agent", "wallet": "0x..."}'`}</pre>
        </div>
      )}
    </div>
  )
}
