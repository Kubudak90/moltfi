'use client'

import { useAgentContext } from '../components/AgentContext'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function AgentPage() {
  const { agents, hasAgent, hasVault, vaults } = useAgentContext()
  const [copied, setCopied] = useState<string | null>(null)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {
      const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  if (!hasVault) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-16 text-center text-muted-foreground">
        Connect your wallet and create a vault first.
      </div>
    )
  }

  const agent = hasAgent ? agents[0] : null

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Agent</h1>

      {hasAgent ? (
        <>
          {/* Connected agent */}
          <Card className="border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="font-medium">{agent?.agentName}</span>
                  <Badge variant="secondary" className="text-green-400 bg-green-400/10">connected</Badge>
                </div>
                <a href={`https://sepolia.basescan.org/address/${vaults[0]}`} target="_blank" rel="noopener"
                  className="text-xs font-mono text-blue-400 hover:underline">vault {(vaults[0] as string).slice(0, 6)}...{(vaults[0] as string).slice(-4)}</a>
              </div>
            </CardContent>
          </Card>

          {/* Skill file */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skill file</CardTitle>
              <CardDescription>Give your agent this URL. It contains everything needed to register, trade, and check balances — all within your guardrails.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-sm text-blue-400 font-mono overflow-x-auto">
                  curl -s {origin}/api/skill
                </code>
                <Button variant="outline" size="sm" onClick={() => copyText(`curl -s ${origin}/api/skill`, 'skill')}>
                  {copied === 'skill' ? (
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Example usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Example request</CardTitle>
              <CardDescription>Your agent sends plain English. MoltFi interprets it, checks limits on-chain, and executes if allowed.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-muted rounded-lg p-4 pr-10 text-xs text-muted-foreground overflow-x-auto">{`curl -X POST ${origin}/api/agent \\
  -H "Authorization: Bearer mf_your_key" \\
  -H "Content-Type: application/json" \\
  -d '{"message": "swap 0.001 WETH to USDC"}'`}</pre>
                <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0"
                  onClick={() => copyText(`curl -X POST ${origin}/api/agent \\\n  -H "Authorization: Bearer mf_your_key" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message": "swap 0.001 WETH to USDC"}'`, 'example')}>
                  {copied === 'example' ? (
                    <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connect your agent</CardTitle>
            <CardDescription>Give your AI agent this skill file. It will register, get an API key, and start trading within your guardrails.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted rounded-lg px-4 py-2.5 text-sm text-blue-400 font-mono overflow-x-auto">
                curl -s {origin}/api/skill
              </code>
              <Button variant="outline" size="sm" onClick={() => copyText(`curl -s ${origin}/api/skill`, 'skill')}>
                {copied === 'skill' ? (
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                )}
              </Button>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">Works with any AI agent — OpenClaw, ChatGPT, Claude, or anything that can make HTTP calls.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
