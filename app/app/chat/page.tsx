'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useAgentContext } from '../components/AgentContext'

export default function ChatPage() {
  const { address } = useAccount()
  const { vaultData, rates } = useAgentContext()
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const send = async () => {
    if (!input.trim() || loading) return
    const msg = input.trim()
    const newMsgs = [...messages, { role: 'user', content: msg }]
    setMessages(newMsgs); setInput(''); setLoading(true)
    try {
      const ctx = `You are an AI DeFi agent for AgentGuard on Base. Vault: ${vaultData?.balances?.WETH || '0'} WETH, ${vaultData?.balances?.USDC || '0'} USDC. ETH: ${rates?.prices?.eth ? '$' + rates.prices.eth.toLocaleString() : '?'}. Lido APR: ${rates?.lido?.smaApr?.toFixed(2) || '?'}%. Speak plainly — the user doesn't know DeFi. If they describe what they want, translate it into actionable advice.`
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'system', content: ctx }, ...newMsgs] }) })
      const data = await res.json()
      if (data.reply) setMessages([...newMsgs, { role: 'assistant', content: data.reply }])
    } catch {}
    setLoading(false)
  }

  if (!address) return <div className="max-w-4xl mx-auto px-6 py-16 text-center text-gray-500">Connect your wallet to chat with your agent.</div>

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Chat</h1>
          <p className="text-sm text-gray-500">Tell your agent what you want in plain English</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-purple-400">
          <div className="w-2 h-2 rounded-full bg-purple-400" />Venice AI · Private
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-6">
        {messages.length === 0 && (
          <div className="space-y-3 pt-8">
            <div className="text-center text-gray-500 mb-6">Ask your agent anything about your portfolio or DeFi strategy</div>
            {[
              'I want to earn yield but keep my money safe',
              'What can you do with my ETH?',
              'Go aggressive — maximize returns',
              'Explain what Lido staking is',
            ].map((s, i) => (
              <button key={i} onClick={() => setInput(s)}
                className="block w-full text-left text-sm text-gray-500 hover:text-indigo-400 bg-gray-800/50 hover:bg-gray-800 rounded-lg px-4 py-3 transition">
                &ldquo;{s}&rdquo;
              </button>
            ))}
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' ? 'bg-indigo-600' : 'bg-gray-800 text-gray-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500 animate-pulse">Thinking...</div>}
      </div>

      <form onSubmit={e => { e.preventDefault(); send() }} className="flex gap-3">
        <input type="text" value={input} onChange={e => setInput(e.target.value)}
          placeholder="Tell your agent what you want..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500" />
        <button type="submit" disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-lg text-sm font-medium transition">Send</button>
      </form>
    </div>
  )
}
