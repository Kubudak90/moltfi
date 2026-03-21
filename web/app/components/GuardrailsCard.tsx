'use client';

import { useEffect, useState } from 'react';
import {
  fetchPolicy,
  fetchDailySpent,
  formatEthDisplay,
  DEMO_HUMAN_ADDRESS,
  DEMO_AGENT_ADDRESS,
  AGENT_POLICY_ADDRESS,
} from '../lib/contracts';

interface GuardrailsData {
  maxPerTrade: bigint | null;
  dailyLimit: bigint | null;
  todayUsage: bigint | null;
  isActive: boolean;
}

export default function GuardrailsCard() {
  const [data, setData] = useState<GuardrailsData>({
    maxPerTrade: null,
    dailyLimit: null,
    todayUsage: null,
    isActive: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGuardrailsData() {
      try {
        setLoading(true);
        const [policy, dailySpent] = await Promise.all([
          fetchPolicy(DEMO_HUMAN_ADDRESS, DEMO_AGENT_ADDRESS),
          fetchDailySpent(DEMO_AGENT_ADDRESS),
        ]);

        if (policy) {
          setData({
            maxPerTrade: policy.maxPerAction,
            dailyLimit: policy.dailyLimit,
            todayUsage: dailySpent,
            isActive: policy.active,
          });
        } else {
          setError('No policy found for this agent');
        }
      } catch (err) {
        console.error('Error fetching guardrails:', err);
        setError('Failed to load guardrails data');
      } finally {
        setLoading(false);
      }
    }

    fetchGuardrailsData();
  }, []);

  const usagePercentage =
    data.dailyLimit && data.todayUsage && data.dailyLimit > 0n
      ? Number((data.todayUsage * 100n) / data.dailyLimit)
      : 0;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'danger';
    if (percentage >= 70) return 'warning';
    return '';
  };

  const formatLimit = (value: bigint | null): string => {
    if (value === null) return '—';
    if (value === 0n) return '0 ETH';
    return formatEthDisplay(value);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">On-Chain Guardrails</h2>
        {loading ? (
          <div className="skeleton w-16 h-6" />
        ) : (
          <span className={`badge ${data.isActive ? 'badge-success' : 'badge-muted'}`}>
            {data.isActive ? 'Active' : 'Inactive'}
          </span>
        )}
      </div>

      {error ? (
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 text-zinc-600 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-zinc-400">{error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                Max Per Trade
              </div>
              {loading ? (
                <div className="skeleton w-20 h-6" />
              ) : (
                <div className="text-xl font-semibold text-white">
                  {formatLimit(data.maxPerTrade)}
                </div>
              )}
            </div>
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                Daily Limit
              </div>
              {loading ? (
                <div className="skeleton w-20 h-6" />
              ) : (
                <div className="text-xl font-semibold text-white">
                  {formatLimit(data.dailyLimit)}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-zinc-400">Today&apos;s Usage</span>
              {loading ? (
                <div className="skeleton w-24 h-4" />
              ) : (
                <span className="text-sm text-white">
                  {formatLimit(data.todayUsage)} / {formatLimit(data.dailyLimit)}
                </span>
              )}
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${getUsageColor(usagePercentage)}`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            {!loading && usagePercentage >= 70 && (
              <p className="text-xs text-amber-400 mt-2">
                {usagePercentage >= 90
                  ? 'Approaching daily limit'
                  : 'Daily limit usage is elevated'}
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span>
                Policy contract:{' '}
                <a
                  href={`https://sepolia.basescan.org/address/${AGENT_POLICY_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline font-mono"
                >
                  {AGENT_POLICY_ADDRESS.slice(0, 6)}...{AGENT_POLICY_ADDRESS.slice(-4)}
                </a>
              </span>
            </div>
            <p className="text-xs text-zinc-600">
              These limits are enforced at the smart contract level. The agent
              cannot exceed them even if compromised.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
