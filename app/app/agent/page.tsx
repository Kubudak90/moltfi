'use client'

import { useAgentContext } from '../components/AgentContext'

export default function AgentPage() {
  const { agents, hasAgent, hasVault, vaults } = useAgentContext()

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
      <h1 className="text-2xl font-bold">Agent</h1>

      {hasAgent ? (
        <>
          {/* Status */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <span className="font-medium">{agent?.agentName}</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Registered</span>
                <div className="text-gray-300 mt-0.5">{agent?.registeredAt ? new Date(agent.registeredAt).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <span className="text-gray-500">Vault</span>
                <div className="mt-0.5">
                  <a href={`https://sepolia.basescan.org/address/${vaults[0]}`} target="_blank" rel="noopener"
                    className="font-mono text-indigo-400 hover:underline">{(vaults[0] as string).slice(0, 6)}...{(vaults[0] as string).slice(-4)}</a>
                </div>
              </div>
              <div>
                <span className="text-gray-500">Auth</span>
                <div className="text-gray-300 mt-0.5">API key (mf_...)</div>
              </div>
            </div>
          </div>

          {/* Connection info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="font-medium">Connect your agent</h3>
            <pre className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/agent \\
  -H "Authorization: Bearer mf_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "swap 0.001 WETH to USDC"}'`}</pre>
            <p className="text-xs text-gray-600">
              Or download the skill: <code className="bg-gray-800 px-1.5 py-0.5 rounded">curl -o moltfi.sh {typeof window !== 'undefined' ? window.location.origin : ''}/api/skill/script</code>
            </p>
          </div>
        </>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <div className="text-lg font-medium">Register an agent</div>
          <pre className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">{`curl -X POST ${typeof window !== 'undefined' ? window.location.origin : ''}/api/agent/register \\
  -H "Content-Type: application/json" \\
  -d '{"agentName": "my-agent", "wallet": "0x..."}'`}</pre>
        </div>
      )}
    </div>
  )
}
