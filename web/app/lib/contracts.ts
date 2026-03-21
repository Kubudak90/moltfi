import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';

// Contract Addresses (Base Sepolia)
export const AGENT_POLICY_ADDRESS = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as const;
export const AGENT_GUARD_ROUTER_ADDRESS = '0x056C1cEC49b335a31247506d30fE36B063cf8B84' as const;

// Demo addresses for displaying on-chain data
export const DEMO_HUMAN_ADDRESS = '0x90d9c75f3761c02Bf3d892A701846F6323e9112D' as const;
export const DEMO_AGENT_ADDRESS = '0x90d9c75f3761c02Bf3d892A701846F6323e9112D' as const;

// AgentPolicy ABI - only the functions we need for reading
export const AGENT_POLICY_ABI = [
  {
    name: 'policies',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'human', type: 'address' },
      { name: 'agent', type: 'address' },
    ],
    outputs: [
      { name: 'maxPerAction', type: 'uint256' },
      { name: 'dailyLimit', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
  },
  {
    name: 'dailySpent',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'day', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'agentOwner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'agent', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    name: 'approvedTokens',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'agent', type: 'address' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// Create public client for Base Sepolia
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://sepolia.base.org'),
});

// Helper to get current day number (matches Solidity: block.timestamp / 1 days)
export function getCurrentDay(): bigint {
  return BigInt(Math.floor(Date.now() / 1000 / 86400));
}

// Fetch policy for a human-agent pair
export async function fetchPolicy(humanAddress: `0x${string}`, agentAddress: `0x${string}`) {
  try {
    const result = await publicClient.readContract({
      address: AGENT_POLICY_ADDRESS,
      abi: AGENT_POLICY_ABI,
      functionName: 'policies',
      args: [humanAddress, agentAddress],
    });
    return {
      maxPerAction: result[0],
      dailyLimit: result[1],
      active: result[2],
    };
  } catch (error) {
    console.error('Error fetching policy:', error);
    return null;
  }
}

// Fetch daily spending for an agent
export async function fetchDailySpent(agentAddress: `0x${string}`) {
  try {
    const currentDay = getCurrentDay();
    const spent = await publicClient.readContract({
      address: AGENT_POLICY_ADDRESS,
      abi: AGENT_POLICY_ABI,
      functionName: 'dailySpent',
      args: [agentAddress, currentDay],
    });
    return spent;
  } catch (error) {
    console.error('Error fetching daily spent:', error);
    return null;
  }
}

// Fetch ETH balance for an address
export async function fetchEthBalance(address: `0x${string}`) {
  try {
    const balance = await publicClient.getBalance({ address });
    return balance;
  } catch (error) {
    console.error('Error fetching ETH balance:', error);
    return null;
  }
}

// Fetch ETH price from CoinGecko
export async function fetchEthPrice(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );
    if (!response.ok) {
      throw new Error('Failed to fetch ETH price');
    }
    const data = await response.json();
    return data.ethereum?.usd ?? null;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    return null;
  }
}

// Format wei to ETH string
export function formatWeiToEth(wei: bigint): string {
  return formatEther(wei);
}

// Format ETH amount to display string (with units)
export function formatEthDisplay(wei: bigint, decimals: number = 4): string {
  const eth = parseFloat(formatEther(wei));
  return `${eth.toFixed(decimals)} ETH`;
}

// Format USD amount
export function formatUsdDisplay(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
