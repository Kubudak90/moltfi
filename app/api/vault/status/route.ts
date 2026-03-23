import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther } from 'viem'
import { base, baseSepolia } from 'viem/chains'

const sepoliaClient = createPublicClient({ chain: baseSepolia, transport: http('https://sepolia.base.org') })
const mainnetClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') })

// Sepolia contracts
const VAULT_FACTORY = '0x672E6aD29eA629398F4Ee29f51ad6Ad3f9869774'
const POLICY = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc'
const WETH = '0x4200000000000000000000000000000000000006'
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'

// Mainnet contracts
const MAINNET_VAULT_FACTORY = '0x5AFC9Ff3230eE0E4bE9e110F7672584Ab593A4F6'
const MAINNET_POLICY = '0x9f5C622170F11C35d3343fE444731E3F732De38a'
const MAINNET_USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
const WSTETH = '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452'

export async function GET(req: NextRequest) {
  const vaultAddress = req.nextUrl.searchParams.get('vault')
  const humanWallet = req.nextUrl.searchParams.get('human')
  const chainParam = req.nextUrl.searchParams.get('chain') // 'mainnet' or 'sepolia' (default)
  const isMainnet = chainParam === 'mainnet'
  const client = isMainnet ? mainnetClient : sepoliaClient
  const factoryAddr = isMainnet ? MAINNET_VAULT_FACTORY : VAULT_FACTORY
  const policyAddr = isMainnet ? MAINNET_POLICY : POLICY
  const usdcAddr = isMainnet ? MAINNET_USDC : USDC

  try {
    // If human wallet provided, look up their vaults from factory
    if (humanWallet) {
      const vaults = await client.readContract({
        address: factoryAddr as `0x${string}`,
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

    // Batch all reads into a single multicall (1 RPC call instead of 9)
    const policyAbi = [
      { name: 'policies', type: 'function', stateMutability: 'view', inputs: [{ name: '', type: 'address' }, { name: '', type: 'address' }], outputs: [{ name: 'maxPerAction', type: 'uint256' }, { name: 'dailyLimit', type: 'uint256' }, { name: 'active', type: 'bool' }] },
      { name: 'getDailySpent', type: 'function', stateMutability: 'view', inputs: [{ name: 'agent', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
      { name: 'getRemainingAllowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'agent', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    ]

    const contracts: any[] = [
      { address: vaultAddress, abi: vaultAbi, functionName: 'owner' },
      { address: vaultAddress, abi: vaultAbi, functionName: 'agent' },
      { address: vaultAddress, abi: vaultAbi, functionName: 'balance', args: [WETH] },
      { address: vaultAddress, abi: vaultAbi, functionName: 'balance', args: [usdcAddr] },
      { address: policyAddr, abi: policyAbi, functionName: 'policies', args: [factoryAddr, vaultAddress] },
      { address: policyAddr, abi: policyAbi, functionName: 'getDailySpent', args: [vaultAddress] },
      { address: policyAddr, abi: policyAbi, functionName: 'getRemainingAllowance', args: [vaultAddress] },
    ]
    if (isMainnet) {
      contracts.push({ address: vaultAddress, abi: vaultAbi, functionName: 'balance', args: [WSTETH] })
    }

    let results: any
    try {
      results = await client.multicall({ contracts: contracts.map(c => ({ ...c, address: c.address as `0x${string}` })), allowFailure: true })
    } catch {
      // Fallback: if multicall itself fails, return minimal data
      return NextResponse.json({ vault: vaultAddress, owner: '0x0', agent: '0x0', balances: { ETH: '0', WETH: '0', USDC: '0' }, chain: isMainnet ? 'base' : 'base-sepolia', policy: { maxPerAction: '0', dailyLimit: '0', active: false, dailySpent: '0', remaining: '0' } })
    }

    const get = (i: number, fallback: any = BigInt(0)) => results[i]?.status === 'success' ? results[i].result : fallback

    const owner = get(0, '0x0')
    const agent = get(1, '0x0')
    const wethBalance = get(2)
    const usdcBalance = get(3)
    const policy = get(4, [BigInt(0), BigInt(0), false])
    const dailySpent = get(5)
    const remaining = get(6)
    const wstethBalance = isMainnet ? get(7) : BigInt(0)

    // ETH balance needs a separate call (not a contract read)
    let ethBalance = BigInt(0)
    try { ethBalance = await client.getBalance({ address: vaultAddress as `0x${string}` }) } catch {}

    return NextResponse.json({
      vault: vaultAddress,
      owner,
      agent,
      balances: {
        ETH: formatEther(ethBalance as bigint),
        WETH: formatEther(wethBalance as bigint),
        USDC: (Number(usdcBalance) / 1000000).toString(),
        ...(isMainnet && { wstETH: formatEther(wstethBalance as bigint) }),
      },
      chain: isMainnet ? 'base' : 'base-sepolia',
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
