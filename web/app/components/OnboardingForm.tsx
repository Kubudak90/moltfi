'use client';

import { useState } from 'react';
import {
  RiskTolerance,
  InvestmentGoal,
  OnboardingData,
  generateStrategy,
  StrategyConfig,
} from '../lib/types';

interface OnboardingFormProps {
  onComplete?: (data: OnboardingData) => void;
}

export default function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance | null>(null);
  const [goal, setGoal] = useState<InvestmentGoal | null>(null);
  const [maxTradeSize, setMaxTradeSize] = useState('');
  const [dailyVolumeLimit, setDailyVolumeLimit] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [strategy, setStrategy] = useState<StrategyConfig | null>(null);

  const isFormValid =
    riskTolerance && goal && maxTradeSize && dailyVolumeLimit;

  const handleReviewStrategy = () => {
    if (riskTolerance && goal) {
      const newStrategy = generateStrategy(riskTolerance, goal);
      setStrategy(newStrategy);
      setShowPreview(true);
    }
  };

  const handleSubmit = () => {
    if (isFormValid && onComplete) {
      onComplete({
        riskTolerance: riskTolerance!,
        goal: goal!,
        maxTradeSize,
        dailyVolumeLimit,
      });
    }
  };

  const riskOptions: { value: RiskTolerance; label: string; description: string }[] = [
    {
      value: 'conservative',
      label: 'Conservative',
      description: 'Prioritize capital preservation with minimal risk',
    },
    {
      value: 'moderate',
      label: 'Moderate',
      description: 'Balance between safety and growth potential',
    },
    {
      value: 'aggressive',
      label: 'Aggressive',
      description: 'Maximize growth with higher risk tolerance',
    },
  ];

  const goalOptions: { value: InvestmentGoal; label: string; description: string }[] = [
    {
      value: 'preserve',
      label: 'Preserve Capital',
      description: 'Protect your assets from loss',
    },
    {
      value: 'yield',
      label: 'Generate Yield',
      description: 'Earn steady returns from your holdings',
    },
    {
      value: 'growth',
      label: 'Growth',
      description: 'Grow your portfolio value over time',
    },
  ];

  return (
    <div id="onboarding" className="card max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-white mb-2">
        Configure Your AI Vault Manager
      </h2>
      <p className="text-zinc-400 mb-8">
        Set your preferences and guardrails. Your agent will operate within these bounds.
      </p>

      {/* Risk Tolerance */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Risk Tolerance
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {riskOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setRiskTolerance(option.value);
                setShowPreview(false);
              }}
              className={`selection-card text-left ${
                riskTolerance === option.value ? 'selected' : ''
              }`}
            >
              <div className="font-medium text-white mb-1">{option.label}</div>
              <div className="text-sm text-zinc-400">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Investment Goal */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-zinc-300 mb-3">
          Investment Goal
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {goalOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setGoal(option.value);
                setShowPreview(false);
              }}
              className={`selection-card text-left ${
                goal === option.value ? 'selected' : ''
              }`}
            >
              <div className="font-medium text-white mb-1">{option.label}</div>
              <div className="text-sm text-zinc-400">{option.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Guardrails */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        <div>
          <label
            htmlFor="maxTradeSize"
            className="block text-sm font-medium text-zinc-300 mb-2"
          >
            Max Trade Size (ETH)
          </label>
          <input
            type="number"
            id="maxTradeSize"
            value={maxTradeSize}
            onChange={(e) => setMaxTradeSize(e.target.value)}
            placeholder="e.g., 0.5"
            className="input"
            step="0.01"
            min="0"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Maximum amount per single trade
          </p>
        </div>
        <div>
          <label
            htmlFor="dailyVolumeLimit"
            className="block text-sm font-medium text-zinc-300 mb-2"
          >
            Daily Volume Limit (ETH)
          </label>
          <input
            type="number"
            id="dailyVolumeLimit"
            value={dailyVolumeLimit}
            onChange={(e) => setDailyVolumeLimit(e.target.value)}
            placeholder="e.g., 2.0"
            className="input"
            step="0.01"
            min="0"
          />
          <p className="text-xs text-zinc-500 mt-1">
            Maximum total volume per 24 hours
          </p>
        </div>
      </div>

      {/* Review Button */}
      <button
        type="button"
        onClick={handleReviewStrategy}
        disabled={!riskTolerance || !goal}
        className="btn-primary w-full mb-6"
      >
        Review Strategy
      </button>

      {/* Strategy Preview */}
      {showPreview && strategy && (
        <div className="border border-blue-500/30 bg-blue-500/5 rounded-xl p-6 mb-6 fade-in">
          <div className="flex items-center gap-2 mb-4">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-white">
              {strategy.name}
            </h3>
          </div>
          <p className="text-zinc-400 mb-4">{strategy.description}</p>

          <div className="space-y-3">
            <div className="text-sm font-medium text-zinc-300 mb-2">
              Proposed Allocation
            </div>
            {strategy.allocations.map((allocation, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="w-24 text-right">
                  <span className="text-white font-medium">
                    {allocation.percentage}%
                  </span>
                </div>
                <div className="flex-1">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${allocation.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-32">
                  <span className="text-zinc-300">{allocation.name}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-700">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-zinc-400">Max per trade:</span>{' '}
                <span className="text-white font-medium">
                  {maxTradeSize || '—'} ETH
                </span>
              </div>
              <div>
                <span className="text-zinc-400">Daily limit:</span>{' '}
                <span className="text-white font-medium">
                  {dailyVolumeLimit || '—'} ETH
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-500 mt-4">
            This is a demo preview. In production, these settings would be
            written on-chain via the AgentPolicy contract.
          </p>
        </div>
      )}

      {/* Continue Button */}
      {showPreview && (
        <a
          href="/dashboard"
          className="btn-secondary w-full block text-center"
        >
          Continue to Dashboard
        </a>
      )}
    </div>
  );
}
