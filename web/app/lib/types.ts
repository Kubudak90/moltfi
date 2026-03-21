// Risk tolerance levels for onboarding
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';

// Investment goals
export type InvestmentGoal = 'preserve' | 'yield' | 'growth';

// Onboarding form data
export interface OnboardingData {
  riskTolerance: RiskTolerance;
  goal: InvestmentGoal;
  maxTradeSize: string; // in ETH
  dailyVolumeLimit: string; // in ETH
}

// Strategy allocation
export interface StrategyAllocation {
  name: string;
  percentage: number;
  description: string;
}

// On-chain policy data
export interface PolicyData {
  maxPerAction: bigint;
  dailyLimit: bigint;
  active: boolean;
}

// Guardrails display data
export interface GuardrailsData {
  maxPerTrade: bigint | null;
  dailyLimit: bigint | null;
  todayUsage: bigint | null;
  isActive: boolean;
  error?: string;
}

// Portfolio position
export interface Position {
  name: string;
  balance: string;
  valueUsd: string | null;
  type: 'native' | 'staking' | 'lending';
  active: boolean;
}

// Activity log entry
export interface ActivityEntry {
  id: string;
  timestamp: Date;
  action: string;
  description: string;
  txHash?: string;
  reasoning?: string;
  status: 'success' | 'failed' | 'pending';
  amount?: string;
}

// Strategy config based on risk + goal
export interface StrategyConfig {
  name: string;
  description: string;
  allocations: StrategyAllocation[];
}

// Generate strategy based on risk tolerance and goal
export function generateStrategy(
  riskTolerance: RiskTolerance,
  goal: InvestmentGoal
): StrategyConfig {
  const strategies: Record<RiskTolerance, Record<InvestmentGoal, StrategyConfig>> = {
    conservative: {
      preserve: {
        name: 'Capital Preservation',
        description: 'Focus on safety with minimal risk exposure',
        allocations: [
          { name: 'USDC Lending', percentage: 60, description: 'Stable yield from lending' },
          { name: 'Lido Staking', percentage: 25, description: 'ETH staking rewards' },
          { name: 'Liquid Reserve', percentage: 15, description: 'Quick access funds' },
        ],
      },
      yield: {
        name: 'Safe Yield',
        description: 'Generate steady yield with low risk',
        allocations: [
          { name: 'USDC Lending', percentage: 50, description: 'Stable lending returns' },
          { name: 'Lido Staking', percentage: 35, description: 'ETH staking rewards' },
          { name: 'Liquid Reserve', percentage: 15, description: 'Quick access funds' },
        ],
      },
      growth: {
        name: 'Conservative Growth',
        description: 'Slow and steady capital appreciation',
        allocations: [
          { name: 'Lido Staking', percentage: 45, description: 'ETH staking rewards' },
          { name: 'USDC Lending', percentage: 35, description: 'Stable base yield' },
          { name: 'Liquid Reserve', percentage: 20, description: 'Quick access funds' },
        ],
      },
    },
    moderate: {
      preserve: {
        name: 'Balanced Preservation',
        description: 'Balance between safety and opportunity',
        allocations: [
          { name: 'USDC Lending', percentage: 45, description: 'Stable yield base' },
          { name: 'Lido Staking', percentage: 35, description: 'ETH staking rewards' },
          { name: 'Liquid Reserve', percentage: 20, description: 'Quick access funds' },
        ],
      },
      yield: {
        name: 'Balanced Yield',
        description: 'Optimize yield with moderate risk',
        allocations: [
          { name: 'Lido Staking', percentage: 50, description: 'ETH staking rewards' },
          { name: 'USDC Lending', percentage: 30, description: 'Lending protocol yield' },
          { name: 'Liquid Reserve', percentage: 20, description: 'Quick access funds' },
        ],
      },
      growth: {
        name: 'Balanced Growth',
        description: 'Grow capital with managed risk',
        allocations: [
          { name: 'Lido Staking', percentage: 55, description: 'ETH staking rewards' },
          { name: 'USDC Lending', percentage: 25, description: 'Stable base yield' },
          { name: 'Liquid Reserve', percentage: 20, description: 'Quick access funds' },
        ],
      },
    },
    aggressive: {
      preserve: {
        name: 'Active Preservation',
        description: 'Preserve with opportunistic moves',
        allocations: [
          { name: 'Lido Staking', percentage: 50, description: 'ETH staking rewards' },
          { name: 'USDC Lending', percentage: 30, description: 'Stable yield' },
          { name: 'Liquid Reserve', percentage: 20, description: 'Quick access funds' },
        ],
      },
      yield: {
        name: 'High Yield',
        description: 'Maximize yield with higher risk tolerance',
        allocations: [
          { name: 'Lido Staking', percentage: 60, description: 'ETH staking rewards' },
          { name: 'USDC Lending', percentage: 25, description: 'Lending yield' },
          { name: 'Liquid Reserve', percentage: 15, description: 'Quick access funds' },
        ],
      },
      growth: {
        name: 'Aggressive Growth',
        description: 'Maximum growth potential',
        allocations: [
          { name: 'Lido Staking', percentage: 65, description: 'ETH exposure + rewards' },
          { name: 'USDC Lending', percentage: 20, description: 'Base yield' },
          { name: 'Liquid Reserve', percentage: 15, description: 'Quick access funds' },
        ],
      },
    },
  };

  return strategies[riskTolerance][goal];
}
