'use client'

import { useState, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'

export function ConnectWallet() {
  const { address, isConnected } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Prevent hydration mismatch — server always renders "Connect Wallet",
  // client may have a connected wallet on first render
  if (!mounted) {
    return (
      <button
        className="bg-indigo-600 hover:bg-indigo-500 text-sm px-4 py-1.5 rounded-lg transition font-medium"
      >
        Connect Wallet
      </button>
    )
  }

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1.5 rounded-lg border border-gray-700 transition font-mono"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </button>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: injected() })}
      className="bg-indigo-600 hover:bg-indigo-500 text-sm px-4 py-1.5 rounded-lg transition font-medium"
    >
      Connect Wallet
    </button>
  )
}
