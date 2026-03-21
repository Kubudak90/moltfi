'use client';

import Link from 'next/link';

interface AllocationItem {
  name: string;
  percentage: number;
  color: string;
}

export default function StrategyCard() {
  // Default strategy for demo - "Moderate Risk / Generate Yield"
  const strategy = {
    name: 'Balanced Yield',
    riskLevel: 'Moderate',
    goal: 'Generate Yield',
    allocations: [
      { name: 'Lido Staking', percentage: 50, color: 'bg-purple-500' },
      { name: 'USDC Lending', percentage: 30, color: 'bg-green-500' },
      { name: 'Liquid Reserve', percentage: 20, color: 'bg-blue-500' },
    ] as AllocationItem[],
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Active Strategy</h2>
        <Link
          href="/#onboarding"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          Edit Strategy
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-semibold gradient-text">{strategy.name}</h3>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-muted">{strategy.riskLevel} Risk</span>
          <span className="badge badge-muted">{strategy.goal}</span>
        </div>
      </div>

      {/* Allocation bar */}
      <div className="mb-4">
        <div className="flex h-3 rounded-full overflow-hidden">
          {strategy.allocations.map((allocation, index) => (
            <div
              key={index}
              className={`${allocation.color}`}
              style={{ width: `${allocation.percentage}%` }}
            />
          ))}
        </div>
      </div>

      {/* Allocation legend */}
      <div className="space-y-2">
        {strategy.allocations.map((allocation, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${allocation.color}`} />
              <span className="text-sm text-zinc-300">{allocation.name}</span>
            </div>
            <span className="text-sm font-medium text-white">{allocation.percentage}%</span>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800">
        <p className="text-xs text-zinc-500">
          Your AI agent will automatically rebalance positions to maintain this allocation
          while respecting your on-chain guardrails.
        </p>
      </div>
    </div>
  );
}
