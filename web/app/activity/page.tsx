import { ActivityEmptyState } from '../components/ActivityEntry';

export default function ActivityPage() {
  // No mock data - activity log starts empty per CLAUDE.md rules
  const activities: never[] = [];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Activity Log</h1>
          <p className="text-zinc-400">
            View all transactions executed by your AI agent.
          </p>
        </div>

        {/* Filters (for future use) */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Filter:</span>
            <button className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              All
            </button>
            <button className="px-3 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors">
              Success
            </button>
            <button className="px-3 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors">
              Failed
            </button>
            <button className="px-3 py-1.5 rounded-lg text-zinc-400 hover:bg-zinc-800 transition-colors">
              Pending
            </button>
          </div>
        </div>

        {/* Activity List or Empty State */}
        {activities.length === 0 ? (
          <ActivityEmptyState />
        ) : (
          <div className="space-y-4">
            {/* Activity entries would render here */}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 card">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-white mb-1">
                About Agent Activity
              </h3>
              <p className="text-sm text-zinc-400 mb-3">
                When your AI agent executes transactions, they will appear here with
                full details including:
              </p>
              <ul className="text-sm text-zinc-400 space-y-1">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Transaction hash with link to BaseScan
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Agent&apos;s reasoning for the transaction
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Amount and status (success/failed/pending)
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Timestamp and action description
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Network Info */}
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-green-400" />
          <span>Monitoring Base Sepolia</span>
        </div>
      </div>
    </div>
  );
}
