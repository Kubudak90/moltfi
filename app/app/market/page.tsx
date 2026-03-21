'use client'

import { useAgentContext } from '../components/AgentContext'

export default function MarketPage() {
  const { rates } = useAgentContext()
  const ethPrice = rates?.prices?.eth ?? null

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market</h1>
        <p className="text-sm text-gray-500">Live data your agent uses to make decisions</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-xs text-gray-500 mb-2">ETH Price</div>
          <div className="text-3xl font-bold">{ethPrice ? `$${ethPrice.toLocaleString()}` : '—'}</div>
          {rates?.prices?.eth24hChange != null && (
            <div className={`text-sm mt-1 ${rates.prices.eth24hChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {rates.prices.eth24hChange >= 0 ? '+' : ''}{rates.prices.eth24hChange.toFixed(2)}% (24h)
            </div>
          )}
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-xs text-gray-500 mb-2">Lido stETH APR</div>
          <div className="text-3xl font-bold">{rates?.lido ? `${rates.lido.smaApr.toFixed(2)}%` : '—'}</div>
          <div className="text-sm text-gray-500 mt-1">7-day SMA</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="text-xs text-gray-500 mb-2">Base Gas</div>
          <div className="text-3xl font-bold">{rates?.baseGas ? rates.baseGas.gwei : '—'}</div>
          <div className="text-sm text-gray-500 mt-1">gwei</div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Available Protocols</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name: 'Lido', desc: 'Liquid staking — deposit ETH, receive stETH that earns yield', yield: rates?.lido ? `${rates.lido.smaApr.toFixed(2)}% APR` : null, color: 'border-blue-500/40' },
            { name: 'Uniswap V3', desc: 'Decentralized exchange — swap tokens at market rates', yield: null, color: 'border-pink-500/40' },
            { name: 'Aave', desc: 'Lending protocol — supply assets to earn interest', yield: null, color: 'border-purple-500/40' },
            { name: 'Compound', desc: 'Lending protocol — earn yield by supplying assets', yield: null, color: 'border-green-500/40' },
          ].map(p => (
            <div key={p.name} className={`border ${p.color} rounded-xl p-4`}>
              <div className="font-medium mb-1">{p.name}</div>
              <div className="text-sm text-gray-400">{p.desc}</div>
              {p.yield && <div className="text-sm text-green-400 mt-2">{p.yield}</div>}
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">All data fetched live from on-chain sources and protocol APIs</p>
    </div>
  )
}
