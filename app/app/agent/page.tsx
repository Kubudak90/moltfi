'use client'

import { useAgentContext } from '../components/AgentContext'
import { useState } from 'react'

export default function AgentPage() {
  const { agents, hasAgent, hasVault, vaults } = useAgentContext()
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  if (!hasVault) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">
        Connect your wallet and create a vault first.
      </div>
    )
  }

  const agent = hasAgent ? agents[0] : null

  const copySkillCmd = () => {
    navigator.clipboard.writeText(`curl -s ${origin}/api/skill`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Agent</h1>

      {hasAgent ? (
        <>
          {/* Connected agent */}
          <div className="bg-gray-900 border border-green-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="font-medium">{agent?.agentName}</span>
                <span className="text-xs text-gray-500">connected</span>
              </div>
              <a href={`https://sepolia.basescan.org/address/${vaults[0]}`} target="_blank" rel="noopener"
                className="text-xs font-mono text-indigo-400 hover:underline">vault {(vaults[0] as string).slice(0, 6)}...{(vaults[0] as string).slice(-4)}</a>
            </div>
          </div>

          {/* Skill file */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="font-medium">Skill file</h3>
            <p className="text-sm text-gray-400">Give your agent this URL. It contains everything needed to register, trade, and check balances — all within your guardrails.</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-800 rounded-lg px-4 py-2.5 text-sm text-indigo-400 font-mono overflow-x-auto">
                curl -s {origin}/api/skill
              </code>
              <button onClick={copySkillCmd} className="bg-gray-800 hover:bg-gray-700 px-3 py-2.5 rounded-lg text-sm transition shrink-0">
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Example usage */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-3">
            <h3 className="font-medium">Example request</h3>
            <pre className="bg-gray-800/50 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto">{`curl -X POST ${origin}/api/agent \\
  -H "Authorization: Bearer mf_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "swap 0.001 WETH to USDC"}'`}</pre>
            <p className="text-xs text-gray-500">Your agent sends plain English. MoltFi interprets it, checks limits on-chain, and executes if allowed.</p>
          </div>
        </>
      ) : (
        /* No agent — show how to connect */
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h3 className="font-medium">Connect your agent</h3>
          <p className="text-sm text-gray-400">Give your AI agent this skill file. It will register, get an API key, and start trading within your guardrails.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-800 rounded-lg px-4 py-2.5 text-sm text-indigo-400 font-mono overflow-x-auto">
              curl -s {origin}/api/skill
            </code>
            <button onClick={copySkillCmd} className="bg-gray-800 hover:bg-gray-700 px-3 py-2.5 rounded-lg text-sm transition shrink-0">
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-gray-500">The skill file contains full instructions for any AI agent — OpenClaw, ChatGPT, Claude, or any agent that can make HTTP calls.</p>
        </div>
      )}
    </div>
  )
}
