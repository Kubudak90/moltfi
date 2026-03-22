import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })

const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774'
const POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc'
const WETH = '0x4200000000000000000000000000000000000006'
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'

export async function GET(req: NextRequest) {
  const vaultAddress = req.nextUrl.searchParams.get('vault')
  const humanWallet = req.nextUrl.searchParams.get('human')

  try {
    // If human wallet provided, look up their vaults from factory
    if (humanWallet) {
      const vaults = await client.readContract({
        address: VAULT_FACTORY as `0x${string}`,
        abi: [{ name: 'getVaults', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: '', type: 'address[]' }] }],
        functionName: 'getVaults',
        args: [humanWallet as `0x${string}`],
      } as any)

      return NextResponse.json({ vaults })
    }

    if (!vaultAddress) {
      return NextResponse.json({ error: 'Provide vault or human query param' }, { status: 400 })
    }

    // Get vault details
    const vaultAbi = [
      { name: 'owner', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
      { name: 'agent', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: '', type: 'address' }] },
      { name: 'balance', type: 'function', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    ]

    const [owner, agent, wethBalance, usdcBalance, ethBalance] = await Promise.all([
      client.readContract({ address: vaultAddress as `0x${string}`, abi: vaultAbi, functionName: 'owner' } as any),
      client.readContract({ address: vaultAddress as `0x${string}`, abi: vaultAbi, functionName: 'agent' } as any),
      client.readContract({ address: vaultAddress as `0x${string}`, abi: vaultAbi, functionName: 'balance', args: [WETH] } as any),
      client.readContract({ address: vaultAddress as `0x${string}`, abi: vaultAbi, functionName: 'balance', args: [USDC] } as any),
      client.getBalance({ address: vaultAddress as `0x${string}` }),
    ])

    // Get policy
    const policyAbi = [
      { name: 'policies', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], outputs: [{ name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }, { name: 'active', type: 'bool' }] },
      { name: 'getDailySpent', type: 'function', stateMutability: 'view', inputs: [{ name: 'agent', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
      { name: 'getRemainingAllowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'agent', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    ]

    // Policy is set with factory as agentOwner, so we need factory address as the human
    const [policy, dailySpent, remaining] = await Promise.all([
      client.readContract({ address: POLICY as `0x${string}`, abi: policyAbi, functionName: 'policies', args: [VAULT_FACTORY, vaultAddress] } as any),
      client.readContract({ address: POLICY as `0x${string}`, abi: policyAbi, functionName: 'getDailySpent', args: [vaultAddress] } as any),
      client.readContract({ address: POLICY as `0x${string}`, abi: policyAbi, functionName: 'getRemainingAllowance', args: [vaultAddress] } as any),
    ])

    return NextResponse.json({
      vault: vaultAddress,
      owner,
      agent,
      balances: {
        ETH: formatEther(ethBalance as bigint),
        WETH: formatEther(wethBalance as bigint),
        USDC: (Number(usdcBalance) / 1000000).toString(),
      },
      policy: {
        maxPerAction: formatEther((policy as any)[0]),
        dailyLimit: formatEther((policy as any)[1]),
        active: (policy as any)[2],
        dailySpent: formatEther(dailySpent as bigint),
        remaining: formatEther(remaining as bigint),
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
