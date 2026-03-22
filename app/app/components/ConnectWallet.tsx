'use client'

import { useState, useEffect, useRef } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => setMounted(true), [])

  // Close menu on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Close menu on navigation
  useEffect(() => setMenuOpen(false), [pathname])

  if (!mounted) {
    return (
      <button className="bg-jpm hover:bg-jpm text-sm px-4 py-1.5 rounded-lg transition font-medium">
        Connect Wallet
      </button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 bg-navy-700 hover:bg-navy-600 text-sm px-3 py-1.5 rounded-lg border border-navy-600 transition"
        >
          <div className="w-5 h-5 rounded-full bg-jpm flex items-center justify-center text-[10px] font-bold">
            {address.slice(2, 4).toUpperCase()}
          </div>
          <span className="font-mono text-xs">{address.slice(0, 6)}...{address.slice(-4)}</span>
          <svg className={`w-3 h-3 text-gray-500 transition ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-navy-800 border border-navy-600 rounded-lg shadow-xl py-1 z-50">
            <Link href="/dashboard"
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 hover:text-white transition">
              Dashboard
            </Link>
            <Link href="/activity"
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 hover:text-white transition">
              Activity
            </Link>
            <Link href="/strategy"
              className="block px-4 py-2 text-sm text-gray-300 hover:bg-navy-700 hover:text-white transition">
              Strategy
            </Link>
            <div className="border-t border-navy-600 my-1" />
            <button
              onClick={() => { disconnect(); setMenuOpen(false) }}
              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-navy-700 transition">
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="bg-jpm hover:bg-jpm text-sm px-4 py-1.5 rounded-lg transition font-medium"
    >
      Connect Wallet
    </button>
  )
}
