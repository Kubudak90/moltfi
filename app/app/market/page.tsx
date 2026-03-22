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
          ].map(p => (
            <div key={p.name} className={`border ${p.color} rounded-xl p-4`}>
              <div className="font-medium mb-1">{p.name}</div>
              <div className="text-sm text-gray-400">{p.desc}</div>
              {p.yield && <div className="text-sm text-green-400 mt-2">{p.yield}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-gray-900 border border-gray-800/50 rounded-xl p-6 opacity-60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-400">Coming Soon</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500 border border-gray-700">Not yet integrated</span>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { name: 'Aave', desc: 'Lending protocol — supply assets to earn interest', color: 'border-gray-700' },
            { name: 'Compound', desc: 'Lending protocol — earn yield by supplying assets', color: 'border-gray-700' },
          ].map(p => (
            <div key={p.name} className={`border ${p.color} rounded-xl p-4`}>
              <div className="font-medium text-gray-400 mb-1">{p.name}</div>
              <div className="text-sm text-gray-600">{p.desc}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-3">These protocols are on the roadmap but not currently connected. No data is being pulled from them.</p>
      </div>

      {/* How market data is used */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold mb-3">How Your Agent Uses This Data</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">→</span>
            <span><strong className="text-gray-300">ETH price</strong> — decides when to swap between WETH and USDC. Drops signal buying opportunities; spikes signal taking profit.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">→</span>
            <span><strong className="text-gray-300">Lido APR</strong> — compared against other yield sources. If staking yield beats trading returns, agent may stake more ETH via Lido.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">→</span>
            <span><strong className="text-gray-300">Gas price</strong> — low gas means cheaper transactions. Agent waits for low gas to maximize returns on each trade.</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-4">All data from live APIs: CoinGecko (ETH price), Lido (stETH APR), Base RPC (gas). No cached or simulated data.</p>
      </div>
    </div>
  )
}
