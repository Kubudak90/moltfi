'use client';

import { ActivityEntry as ActivityEntryType } from '../lib/types';

interface ActivityEntryProps {
  entry: ActivityEntryType;
}

export function ActivityEntry({ entry }: ActivityEntryProps) {
  const getStatusBadge = (status: ActivityEntryType['status']) => {
    switch (status) {
      case 'success':
        return <span className="badge badge-success">Success</span>;
      case 'failed':
        return <span className="badge badge-danger">Failed</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending</span>;
    }
  };

  const getStatusIcon = (status: ActivityEntryType['status']) => {
    switch (status) {
      case 'success':
        return (
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'failed':
        return (
          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'pending':
        return (
          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
            <svg className="w-5 h-5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="card card-hover">
      <div className="flex gap-4">
        {getStatusIcon(entry.status)}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="font-medium text-white">{entry.action}</h3>
              <p className="text-sm text-zinc-400">{entry.description}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {getStatusBadge(entry.status)}
              <span className="text-xs text-zinc-500">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
          </div>

          {entry.amount && (
            <div className="text-sm text-zinc-300 mb-2">
              Amount: <span className="text-white font-medium">{entry.amount}</span>
            </div>
          )}

          {entry.reasoning && (
            <div className="bg-zinc-900/50 rounded-lg p-3 mb-2">
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                Agent Reasoning
              </div>
              <p className="text-sm text-zinc-300">{entry.reasoning}</p>
            </div>
          )}

          {entry.txHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${entry.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
            >
              <span className="font-mono">
                {entry.txHash.slice(0, 10)}...{entry.txHash.slice(-8)}
              </span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityEmptyState() {
  return (
    <div className="card">
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          No Activity Yet
        </h3>
        <p className="text-zinc-400 max-w-sm mx-auto">
          Agent not yet active — activity will appear here once your agent starts
          executing transactions.
        </p>
      </div>
    </div>
  );
}
