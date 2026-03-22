'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { usePathname } from 'next/navigation'
import { useAgentContext } from './AgentContext'

export function PrivacyIndicator() {
  const { isConnected } = useAccount()
  const { vaults } = useAgentContext()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [privateMode, setPrivateMode] = useState(false)

  useEffect(() => setMounted(true), [])

  // Check private mode status
  useEffect(() => {
    if (!vaults?.[0]) return
    fetch(`/api/vault/private-mode?vault=${vaults[0]}`)
      .then(r => r.json())
      .then(d => setPrivateMode(d.privateMode))
      .catch(() => {})
  }, [vaults])

  // Only show on app pages (not landing)
  if (!mounted || pathname === '/' || !isConnected) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs transition ${
          privateMode
            ? 'bg-indigo-600/10 border-indigo-500/20 text-yellow-300 hover:bg-indigo-600/20'
            : 'bg-gray-800/50 border-gray-800 text-gray-500 hover:bg-gray-800'
        }`}
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d={privateMode
            ? "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            : "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
          } />
        </svg>
        <span>{privateMode ? 'Venice Only' : 'Standard'}</span>
        {privateMode && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
      </button>

      {showDetail && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-5 z-50">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-semibold text-sm">{privateMode ? 'Private Mode Active' : 'Standard Mode'}</span>
          </div>

          <div className="space-y-3 text-xs text-gray-400">
            {privateMode ? (
              <>
                <p className="text-gray-300">
                  The server checks <code className="text-indigo-400 bg-gray-800 px-1 rounded">data/private-mode.json</code> on every AI request. When enabled, only Venice AI is called. If Venice is unreachable, the request fails with a 503 — it never falls back to another provider.
                </p>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-300 font-medium">Venice: zero data retention</span>
                    <p className="mt-0.5">Per <a href="https://venice.ai/privacy" target="_blank" rel="noopener" className="text-indigo-400 hover:underline">Venice&apos;s privacy policy</a> — requests are not logged or used for training.</p>
                  </div>
                </div>
                <p className="text-gray-600">Note: vault balances and trades are public blockchain data. Privacy applies to AI analysis and strategy reasoning only.</p>
              </>
            ) : (
              <p className="text-gray-300">
                AI requests can use any available provider. Enable Private Mode on the <a href="/guardrails" className="text-indigo-400 hover:underline">Guardrails page</a> to restrict all inference to Venice AI.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800">
            <a href="https://venice.ai" target="_blank" rel="noopener" className="text-xs text-gray-600 hover:text-gray-400">
              AI provider: Venice AI →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
