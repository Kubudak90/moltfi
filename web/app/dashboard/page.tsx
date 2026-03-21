import PortfolioCard from '../components/PortfolioCard';
import GuardrailsCard from '../components/GuardrailsCard';
import StrategyCard from '../components/StrategyCard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-zinc-400">
            Monitor your portfolio, strategy, and on-chain guardrails in real-time.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Portfolio (spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            <PortfolioCard />
            <StrategyCard />
          </div>

          {/* Right Column - Guardrails */}
          <div className="lg:col-span-1">
            <GuardrailsCard />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 card">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="/#onboarding"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">Edit Strategy</div>
                <div className="text-sm text-zinc-400">Adjust your preferences</div>
              </div>
            </a>

            <a
              href="/activity"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">View Activity</div>
                <div className="text-sm text-zinc-400">See transaction history</div>
              </div>
            </a>

            <a
              href="https://sepolia.basescan.org/address/0x63649f61F29CE6dC9415263F4b727Bc908206Fbc"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">View Contract</div>
                <div className="text-sm text-zinc-400">BaseScan explorer</div>
              </div>
            </a>
          </div>
        </div>

        {/* Network Info */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span>Connected to Base Sepolia</span>
        </div>
      </div>
    </div>
  );
}
