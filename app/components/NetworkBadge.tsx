'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useChains, useSwitchChain } from 'wagmi'

/**
 * Network badge with in-app chain switcher.
 * 
 * Modern MetaMask uses per-site chain connections (EIP-6963).
 * Switching networks in MetaMask's UI does NOT change the dapp's chain.
 * The dapp must request chain switches via wallet_switchEthereumChain,
 * which wagmi's useSwitchChain handles.
 * 
 * See: https://wagmi.sh/react/api/hooks/useSwitchChain
 */
export function NetworkBadge() {
  const { isConnected, chainId } = useAccount()
  const chains = useChains()
  const { switchChain } = useSwitchChain()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!mounted) {
    return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-400/15 text-gray-400 border border-gray-500/25">Base</span>
  }

  if (!isConnected) {
    return <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-400/15 text-gray-400 border border-gray-500/25">Not connected</span>
  }

  const isMainnet = chainId === 8453
  const isSepolia = chainId === 84532
  const label = isMainnet ? 'Base Mainnet' : isSepolia ? 'Base Sepolia' : `Chain ${chainId}`
  const color = isMainnet
    ? 'bg-blue-400/15 text-blue-400 border-blue-500/25 hover:bg-blue-400/25'
    : isSepolia
    ? 'bg-yellow-400/15 text-yellow-400 border-yellow-500/25 hover:bg-yellow-400/25'
    : 'bg-red-400/15 text-red-400 border-red-500/25 hover:bg-red-400/25'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded border transition cursor-pointer flex items-center gap-1 ${color}`}
      >
        {label}
        <svg className={`w-2.5 h-2.5 transition ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-[100] min-w-[150px]">
          {chains.map((chain) => {
            const active = chain.id === chainId
            const chainColor = chain.id === 8453 ? 'text-blue-400' : chain.id === 84532 ? 'text-yellow-400' : 'text-gray-300'
            return (
              <button
                key={chain.id}
                type="button"
                onClick={() => {
                  switchChain({ chainId: chain.id })
                  setOpen(false)
                }}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs transition ${active ? `${chainColor} bg-white/5` : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-current' : 'bg-transparent'}`} />
                {chain.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
