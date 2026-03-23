'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAccount } from 'wagmi'

type AgentInfo = { agentWallet: string; agentName: string; platform: string; registeredAt: string }
type Rates = {
  lido: { smaApr: number } | null
  prices: { eth: number; eth24hChange: number } | null
  baseGas: { gwei: string } | null
}

type AgentContextType = {
  agents: AgentInfo[]
  vaults: string[]
  vaultData: any
  rates: Rates | null
  serverAgentWallet: string | null
  hasAgent: boolean
  hasVault: boolean
  ethPrice: number | null
  refreshVaults: () => void
}

const AgentContext = createContext<AgentContextType>({
  agents: [], vaults: [], vaultData: null, rates: null,
  serverAgentWallet: null,
  hasAgent: false, hasVault: false, ethPrice: null, refreshVaults: () => {},
})

export function useAgentContext() { return useContext(AgentContext) }

export function AgentProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount()
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [vaults, setVaults] = useState<string[]>([])
  const [vaultData, setVaultData] = useState<any>(null)
  const [rates, setRates] = useState<Rates | null>(null)
  const [serverAgentWallet, setServerAgentWallet] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/rates').then(r => r.json()).then(setRates).catch(() => {})
    // Fetch the server's agent wallet address (used as agent in vaults)
    fetch('/api/agent/wallet').then(r => r.json()).then(d => setServerAgentWallet(d.agentWallet || null)).catch(() => {})
  }, [])

  const refreshVaults = () => {
    if (!address) return
    fetch(`/api/vault/status?human=${address}`).then(r => r.json()).then(d => {
      setVaults(d.vaults || [])
      if (d.vaults?.length > 0) {
        fetch(`/api/vault/status?vault=${d.vaults[0]}`).then(r => r.json()).then(vd => {
          // Also fetch policy to get approvedTokens
          fetch(`/api/policy?vault=${d.vaults[0]}`).then(r => r.json()).then(pd => {
            setVaultData({ ...vd, approvedTokens: pd.approvedTokens || {} })
          }).catch(() => setVaultData(vd))
        }).catch(() => {})
      }
    }).catch(() => {})
  }

  useEffect(() => {
    if (!address) return
    const check = () => {
      fetch(`/api/agent/register?humanWallet=${address}`).then(r => r.json()).then(d => setAgents(d.agents || [])).catch(() => {})
      refreshVaults()
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [address])

  return (
    <AgentContext.Provider value={{
      agents, vaults, vaultData, rates, serverAgentWallet,
      hasAgent: agents.length > 0,
      hasVault: vaults.length > 0,
      ethPrice: rates?.prices?.eth ?? null,
      refreshVaults,
    }}>
      {children}
    </AgentContext.Provider>
  )
}
