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
        <span>{privateMode ? 'Private Mode' : 'Standard Mode'}</span>
        {privateMode && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
      </button>

      {showDetail && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-5 z-50">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-semibold text-sm">{privateMode ? 'Private Mode Active' : 'Standard Mode'}</span>
            <div className={`ml-auto flex items-center gap-1 text-xs ${privateMode ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${privateMode ? 'bg-green-400' : 'bg-gray-600'}`} />
              {privateMode ? 'Enforced' : 'Off'}
            </div>
          </div>

          <div className="space-y-3 text-xs text-gray-400">
            {privateMode ? (
              <>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-300 font-medium">Venice-only inference enforced</span>
                    <p className="mt-0.5">All strategy generation for this vault must go through Venice AI. Other providers are blocked.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-300 font-medium">Zero data retention</span>
                    <p className="mt-0.5">Venice processes your requests and immediately discards them. No logs, no training data, no storage.</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <div>
                    <span className="text-gray-300 font-medium">Financial data stays private</span>
                    <p className="mt-0.5">Portfolio balances, strategies, and analysis are never retained by any AI provider.</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-2">
                <span className="text-gray-600 mt-0.5">○</span>
                <div>
                  <span className="text-gray-300 font-medium">Standard mode</span>
                  <p className="mt-0.5">Your agent can use any AI provider. Enable Private Mode on the Guardrails page to enforce Venice-only inference.</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Model: <span className="text-gray-400 font-mono">llama-3.3-70b</span>
            </div>
            <a href="https://venice.ai" target="_blank" rel="noopener" className="text-xs text-yellow-400 hover:underline">
              Powered by Venice AI →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
