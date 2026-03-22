'use client'

export default function ActivityPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity</h1>
        <p className="text-sm text-gray-500">Every action your agent takes, verified on-chain</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl divide-y divide-gray-800">
        <div className="flex items-start gap-4 p-5">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-200">Swap</span>
              <span className="text-xs text-gray-500">Base Sepolia</span>
            </div>
            <div className="text-sm text-gray-400 mb-2">Swapped 0.005 WETH → 2.045 USDC via AgentGuardRouter</div>
            <a href="https://sepolia.basescan.org/tx/0x1abcce6a0d00eccdc303a4f7197a8b8a4f90b86661059e199dda45d3037422d1"
              target="_blank" rel="noopener" className="text-xs text-indigo-400 hover:underline">View on Basescan →</a>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600">More activity will appear as your agent trades.</p>

      {/* How activity tracking works */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="font-semibold mb-3">How Activity Tracking Works</h3>
        <div className="space-y-3 text-sm text-gray-400">
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">1.</span>
            <span><strong className="text-gray-300">Every trade goes through AgentGuardRouter</strong> — the smart contract logs what was swapped, how much, and the transaction hash.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">2.</span>
            <span><strong className="text-gray-300">Policy checks happen on-chain</strong> — before each swap, the contract verifies the trade is within your guardrails. If not, it reverts. No exceptions.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 font-bold shrink-0">3.</span>
            <span><strong className="text-gray-300">Full audit trail on Basescan</strong> — click any transaction to see the exact details on the blockchain explorer. This can&apos;t be edited or faked.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
