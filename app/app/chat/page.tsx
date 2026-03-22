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
  const bottomRef = useRef<HTMLDivElement>(null)

  const systemContext = `You are the AgentGuard AI Financial Advisor (Beta), powered by Venice AI with zero data retention.
You help users understand DeFi strategies for their vault on Base.
Current vault data:
- WETH: ${vaultData?.balances?.WETH || '0'}
- USDC: ${vaultData?.balances?.USDC || '0'}
- ETH: ${vaultData?.balances?.ETH || '0'}
- ETH Price: $${rates?.prices?.eth?.toLocaleString() || 'unknown'}
- Lido APR: ${rates?.lido ? rates.lido.smaApr.toFixed(2) + '%' : 'unknown'}
Available protocols: Uniswap V3 (swaps), Lido (staking). Only these two.
Be concise, plain English, no jargon. You're talking to a human who may not know DeFi.
If they ask about deploying a strategy, explain that clicking "Approve & Start Agent" on the Strategy tab writes guardrails to a smart contract — the agent physically cannot exceed those limits.`

  // Handle strategy context from URL params
  useEffect(() => {
    const strategyParam = searchParams.get('strategy')
    if (strategyParam) {
      try {
        const strategy = JSON.parse(decodeURIComponent(strategyParam))
        const intro: Message = {
          role: 'assistant',
          content: `I see you're looking at the **${strategy.name}** strategy.\n\n${strategy.description}\n\n**Expected yield:** ${strategy.expectedYield}\n**Max trade size:** ${strategy.guardrails?.maxTradeSize}\n**Daily limit:** ${strategy.guardrails?.dailyLimit}\n\nWant me to explain how this works, what the risks are, or help you decide if this is right for your vault?`
        }
        setMessages([intro])
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
            AI Financial Advisor
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/25 font-normal">Beta</span>
          </h1>
          <p className="text-sm text-gray-500">Private analysis powered by Venice AI — zero data retention</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-purple-400">
          <div className="w-2 h-2 rounded-full bg-purple-400" />Venice AI
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-purple-600/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Private Financial Analysis</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Ask me anything about your vault, DeFi strategies, or market conditions.
              All analysis routed through Venice AI — your data is never stored.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['What should I do with my vault?', 'Explain the risks of each strategy', 'How do guardrails protect me?', 'When should I rebalance?'].map(q => (
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
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
        <button onClick={send} disabled={loading || !input.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:text-gray-500 px-5 py-3 rounded-lg text-sm font-medium transition">
          Send
        </button>
      </div>
    </div>
  )
}
