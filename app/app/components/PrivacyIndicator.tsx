'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { usePathname } from 'next/navigation'

export function PrivacyIndicator() {
  const { isConnected } = useAccount()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => setMounted(true), [])

  // Only show on app pages (not landing)
  if (!mounted || pathname === '/' || !isConnected) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-3 py-1 text-xs text-purple-300 hover:bg-purple-500/20 transition"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>Private Mode</span>
        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
      </button>

      {showDetail && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-xl p-5 z-50">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-semibold text-sm">Private Mode Active</span>
            <div className="ml-auto flex items-center gap-1 text-xs text-green-400">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              Enabled
            </div>
          </div>

          <div className="space-y-3 text-xs text-gray-400">
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <div>
                <span className="text-gray-300 font-medium">Zero data retention</span>
                <p className="mt-0.5">Venice AI processes your requests and immediately discards them. No logs, no training data, no storage.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <div>
                <span className="text-gray-300 font-medium">Financial data stays private</span>
                <p className="mt-0.5">Your portfolio balances, trading strategies, and chat history are never exposed to or retained by any AI provider.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <div>
                <span className="text-gray-300 font-medium">On-device inference ready</span>
                <p className="mt-0.5">Venice supports local model inference — your data never leaves your machine.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between">
            <div className="text-xs text-gray-600">
              Model: <span className="text-gray-400 font-mono">llama-3.3-70b</span>
            </div>
            <a href="https://venice.ai" target="_blank" rel="noopener" className="text-xs text-purple-400 hover:underline">
              Powered by Venice AI →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
