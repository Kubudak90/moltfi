'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { useSearchParams } from 'next/navigation'
import { useAgentContext } from '../components/AgentContext'

type Message = { role: 'user' | 'assistant'; content: string }

export default function ChatPage() {
  const { address } = useAccount()
  const { vaults, vaultData, rates } = useAgentContext()
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'chat' | 'connect'>('chat')
  const bottomRef = useRef<HTMLDivElement>(null)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''

  const systemContext = `You are MoltFi's DeFi Agent — a financial advisor that specializes in DeFi. You're powered by Venice AI with zero data retention.

You serve two roles:
1. When an AI agent calls you through the API, you advise on trades and strategy — agent to agent.
2. When a human talks to you here on the dashboard, you explain things in plain English — no jargon.

Current vault data:
- WETH: ${vaultData?.balances?.WETH || '0'}
- USDC: ${vaultData?.balances?.USDC || '0'}
- ETH: ${vaultData?.balances?.ETH || '0'}
- ETH Price: $${rates?.prices?.eth?.toLocaleString() || 'unknown'}
- Lido APR: ${rates?.lido ? rates.lido.smaApr.toFixed(2) + '%' : 'unknown'}
Available protocols: Uniswap V3 (swaps), Lido (staking). Only these two.

Be concise, plain English, no jargon. The human may not know DeFi.
If they ask how the agent-to-agent flow works: their personal AI agent (on OpenClaw or any platform) installs the MoltFi skill, then periodically consults you for advice and executes trades through the vault — all within on-chain guardrails the human set.`

  // Handle strategy context from URL params
  useEffect(() => {
    const strategyParam = searchParams.get('strategy')
    if (strategyParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(strategyParam))
        // Could be a single strategy or array of strategies
        const strategies = Array.isArray(parsed) ? parsed : [parsed]
        if (strategies.length === 1) {
          const s = strategies[0]
          setMessages([{
            role: 'assistant',
            content: `I see you're looking at the **${s.name}** strategy.\n\n${s.description}\n\n**Expected yield:** ${s.expectedYield}\n**Max trade size:** ${s.guardrails?.maxTradeSize}\n**Daily limit:** ${s.guardrails?.dailyLimit}\n\nWant me to explain how this works, what the risks are, or help you decide if this is right for your vault?`
          }])
        } else if (strategies.length > 1) {
          const summary = strategies.map((s: any, i: number) => `**${i + 1}. ${s.name}** — ${s.description} (${s.expectedYield})`).join('\n\n')
          setMessages([{
            role: 'assistant',
            content: `Here are the strategies we generated for your vault:\n\n${summary}\n\nWhich one interests you? I can explain the risks, compare them, or suggest which fits your situation best.`
          }])
        }
      } catch {}
    }
  }, [searchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemContext },
            ...updated.map(m => ({ role: m.role, content: m.content }))
          ]
        })
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I had trouble connecting to Venice AI. Try again.' }])
    }
    setLoading(false)
  }

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to get started.</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col" style={{ height: 'calc(100vh - 7.5rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            DeFi Agent
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-600/15 text-yellow-400 border border-indigo-500/25 font-normal">Beta</span>
          </h1>
          <p className="text-sm text-gray-500">Your DeFi financial advisor — powered by Venice AI</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-yellow-400">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />Venice AI · Zero Retention
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-800 pb-px">
        <button onClick={() => setTab('chat')}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${tab === 'chat' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
          Chat with Advisor
        </button>
        <button onClick={() => setTab('connect')}
          className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${tab === 'connect' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>
          Connect Your Agent
        </button>
      </div>

      {tab === 'connect' ? (
        /* Connect your agent tab */
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Agent-to-agent diagram */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="font-semibold mb-4">How it works — agent to agent</h2>
            <div className="flex items-center justify-center gap-3 mb-6 py-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-indigo-400">You</span>
                </div>
                <div className="text-xs text-gray-500">Human</div>
              </div>
              <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-blue-400">AI</span>
                </div>
                <div className="text-xs text-gray-500">Your Agent</div>
              </div>
              <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-yellow-400">DeFi</span>
                </div>
                <div className="text-xs text-gray-500">Our Advisor</div>
              </div>
              <svg className="w-5 h-5 text-gray-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-2">
                  <span className="text-[10px] font-bold text-green-400">Chain</span>
                </div>
                <div className="text-xs text-gray-500">Blockchain</div>
              </div>
            </div>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 font-bold shrink-0">1.</span>
                <span>You tell your agent what you want — &quot;put my money to work&quot; or &quot;check on my portfolio&quot;</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 font-bold shrink-0">2.</span>
                <span>Your agent reads the MoltFi skill and knows how to call our API</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 font-bold shrink-0">3.</span>
                <span>Our advisor analyzes markets privately (Venice AI, zero retention) and recommends trades</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 font-bold shrink-0">4.</span>
                <span>Your agent executes through the vault — the blockchain enforces your guardrails</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-indigo-400 font-bold shrink-0">5.</span>
                <span>Your agent adds this to its heartbeat — it checks in automatically, no prompting needed</span>
              </div>
            </div>
          </div>

          {/* Skill file */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-2">Send this to your agent</h3>
            <p className="text-sm text-gray-500 mb-4">Your agent reads this skill file and knows how to call MoltFi — register, check rates, request trades. We handle the DeFi execution.</p>
            <div className="bg-gray-950 rounded-lg p-4 font-mono text-sm text-gray-300 relative group">
              <div className="break-all">{baseUrl}/api/skill</div>
              <button onClick={() => { navigator.clipboard.writeText(`${baseUrl}/api/skill`); }}
                className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-2 py-1 rounded text-xs transition opacity-0 group-hover:opacity-100">
                Copy
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-3">Works with any AI agent that can make HTTP calls — OpenClaw, custom agents, anything.</p>
          </div>

          {/* Quick copy for OpenClaw */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-2">OpenClaw quick setup</h3>
            <p className="text-sm text-gray-500 mb-4">Tell your OpenClaw agent:</p>
            <div className="bg-gray-950 rounded-lg p-4 text-sm text-gray-300 relative group">
              <div className="italic">&quot;Read the MoltFi skill at {baseUrl}/api/skill and register with my wallet {address ? address : 'YOUR_WALLET'}. Then add MoltFi check-ins to your heartbeat.&quot;</div>
              <button onClick={() => { navigator.clipboard.writeText(`Read the MoltFi skill at ${baseUrl}/api/skill and register with my wallet ${address || 'YOUR_WALLET'}. Then add MoltFi check-ins to your heartbeat.`); }}
                className="absolute top-2 right-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white px-2 py-1 rounded text-xs transition opacity-0 group-hover:opacity-100">
                Copy
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Chat tab */
        <>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold mb-2">Talk to the DeFi Advisor</h2>
                <p className="text-gray-500 text-sm max-w-md mx-auto mb-2">
                  I&apos;m the DeFi specialist your agent talks to through the API. You can also ask me questions directly here.
                </p>
                <p className="text-gray-600 text-xs max-w-md mx-auto mb-6">
                  All analysis runs through Venice AI (zero data retention). Strategies are cached in your browser only — not on our servers.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {['What should I do with my vault?', 'Explain the risks of each strategy', 'How do guardrails protect me?', 'How does agent-to-agent work?'].map(q => (
                    <button key={q} onClick={() => { setInput(q); }}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-2 rounded-lg transition">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300'
                }`}>
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? 'mt-2' : ''}>
                      {line.split(/(\*\*.*?\*\*)/).map((part, k) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={k} className="text-white">{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </p>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 rounded-xl px-4 py-3 text-sm text-gray-400">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing privately via Venice...
                  </span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="Ask about your vault, strategies, or DeFi..."
              className="flex-1 bg-gray-800 border border-gray-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
            <button onClick={send} disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-600 disabled:bg-gray-800 disabled:text-gray-500 px-5 py-3 rounded-lg text-sm font-medium transition">
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}
