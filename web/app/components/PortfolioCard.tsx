'use client';

import { useEffect, useState } from 'react';
import {
  fetchEthBalance,
  fetchEthPrice,
  formatEthDisplay,
  formatUsdDisplay,
  DEMO_AGENT_ADDRESS,
} from '../lib/contracts';

interface PositionRowProps {
  name: string;
  balance: string | null;
  valueUsd: string | null;
  type: 'native' | 'staking' | 'lending';
  active: boolean;
  loading?: boolean;
}

function PositionRow({
  name,
  balance,
  valueUsd,
  type,
  active,
  loading,
}: PositionRowProps) {
  const getIcon = () => {
    switch (type) {
      case 'native':
        return (
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-blue-400 text-sm font-semibold">E</span>
          </div>
        );
      case 'staking':
        return (
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      case 'lending':
        return (
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <div className="text-white font-medium">{name}</div>
          {!active && (
            <div className="text-xs text-zinc-500">Not active</div>
          )}
        </div>
      </div>
      <div className="text-right">
        {loading ? (
          <div className="skeleton w-20 h-5 mb-1" />
        ) : (
          <div className="text-white font-medium">
            {balance ?? '—'}
          </div>
        )}
        {loading ? (
          <div className="skeleton w-16 h-4" />
        ) : (
          <div className="text-sm text-zinc-400">
            {valueUsd ?? '—'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortfolioCard() {
  const [ethBalance, setEthBalance] = useState<bigint | null>(null);
  const [ethPrice, setEthPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [balance, price] = await Promise.all([
          fetchEthBalance(DEMO_AGENT_ADDRESS),
          fetchEthPrice(),
        ]);
        setEthBalance(balance);
        setEthPrice(price);
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
        setError('Failed to load portfolio data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const ethBalanceDisplay = ethBalance !== null ? formatEthDisplay(ethBalance) : null;
  const ethValueUsd =
    ethBalance !== null && ethPrice !== null
      ? formatUsdDisplay(parseFloat(ethBalanceDisplay?.replace(' ETH', '') ?? '0') * ethPrice)
      : null;

  const totalValueUsd =
    ethBalance !== null && ethPrice !== null
      ? parseFloat(ethBalanceDisplay?.replace(' ETH', '') ?? '0') * ethPrice
      : null;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">Portfolio</h2>
        <div className="text-right">
          <div className="text-xs text-zinc-500 uppercase tracking-wide">Total Value</div>
          {loading ? (
            <div className="skeleton w-24 h-7 mt-1" />
          ) : error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : (
            <div className="text-2xl font-semibold text-white">
              {totalValueUsd !== null ? formatUsdDisplay(totalValueUsd) : '—'}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <PositionRow
          name="ETH Balance"
          balance={ethBalanceDisplay}
          valueUsd={ethValueUsd}
          type="native"
          active={true}
          loading={loading}
        />
        <PositionRow
          name="Lido Staking"
          balance={null}
          valueUsd={null}
          type="staking"
          active={false}
          loading={false}
        />
        <PositionRow
          name="USDC Lending"
          balance={null}
          valueUsd={null}
          type="lending"
          active={false}
          loading={false}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Agent address:{' '}
            <a
              href={`https://sepolia.basescan.org/address/${DEMO_AGENT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline font-mono"
            >
              {DEMO_AGENT_ADDRESS.slice(0, 6)}...{DEMO_AGENT_ADDRESS.slice(-4)}
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
