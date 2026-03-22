'use client'

import { useAccount } from 'wagmi'

export default function ChatPage() {
  const { address } = useAccount()

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to get started.</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Talk to Your Agent</h1>
        <p className="text-sm text-gray-500">Your AI agent manages your vault — talk to it through your own platform</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-3">Your agent lives on your platform</h2>
        <p className="text-gray-400 text-sm max-w-lg mx-auto mb-6">
          AgentGuard doesn&apos;t replace your AI agent — it gives your agent superpowers.
          Talk to your agent wherever you normally do (OpenClaw, Telegram, Discord, etc.)
          and it manages your vault through the AgentGuard API.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold mb-4">How It Works</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm text-purple-400">1</span>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Give your agent the AgentGuard skill</div>
              <p className="text-xs text-gray-500">Copy the skill file and add it to your agent&apos;s configuration. It teaches your agent everything — deposits, swaps, staking, monitoring.</p>
              <a href="/api/skill" target="_blank" className="text-xs text-indigo-400 hover:underline mt-1 inline-block">View skill file →</a>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm text-purple-400">2</span>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">Your agent registers itself</div>
              <p className="text-xs text-gray-500">One API call. Your agent tells AgentGuard its wallet address and links to your human wallet.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-sm text-purple-400">3</span>
            </div>
            <div>
              <div className="text-sm font-medium mb-1">You talk, it trades</div>
              <p className="text-xs text-gray-500">Tell your agent &quot;put my ETH to work&quot; or &quot;what&apos;s my vault doing?&quot; and it uses the AgentGuard API to check, trade, and stake — all within your on-chain guardrails.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Private Mode explanation */}
      <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="font-semibold text-sm">Private Mode &amp; Venice AI</span>
        </div>
        <p className="text-sm text-gray-400 mb-3">
          When Private Mode is active on your vault, all AI strategy analysis is routed through Venice AI with zero data retention.
          Your agent can only generate strategies through the AgentGuard API&apos;s Venice pipeline — ensuring your financial data is never stored or used for training by any AI provider.
        </p>
        <p className="text-xs text-gray-600">
          Activate Private Mode on the Guardrails tab to enforce Venice-only inference on your vault.
        </p>
      </div>
    </div>
  )
}
