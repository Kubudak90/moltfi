import { NextResponse } from 'next/server'
import { createWalletClient, createPublicClient, http, parseEther, parseAbi } from 'viem'
import { baseSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import * as fs from 'fs'
import * as path from 'path'

const POLICY_CONTRACT = '0x63649f61F29CE6dC9415263F4b727Bc908206Fbc' as `0x${string}`
const WETH = '0x4200000000000000000000000000000000000006' as `0x${string}`
const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as `0x${string}`

const ABI = parseAbi([
  'function setPolicy(address agent, uint256 maxPerAction, uint256 dailyLimit) external',
  'function approveToken(address agent, address token) external',
  'function policies(address, address) view returns (uint256 maxPerAction, uint256 dailyLimit, bool active)',
])

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { agentAddress, maxTradeSize, dailyLimit } = body

    if (!agentAddress || !maxTradeSize || !dailyLimit) {
      return NextResponse.json({ error: 'Missing agentAddress, maxTradeSize, or dailyLimit' }, { status: 400 })
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(agentAddress)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 })
    }

    // Load admin key
    const keyPath = path.join(process.env.HOME || '', '.openclaw/credentials/.kyro-wallet-key')
    const privateKey = fs.readFileSync(keyPath, 'utf-8').trim() as `0x${string}`
    const account = privateKeyToAccount(privateKey)

    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    })

    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http('https://sepolia.base.org'),
    })

    const maxWei = parseEther(String(maxTradeSize))
    const dailyWei = parseEther(String(dailyLimit))

    // Set policy
    const setPolicyHash = await walletClient.writeContract({
      address: POLICY_CONTRACT,
      abi: ABI,
      functionName: 'setPolicy',
      args: [agentAddress as `0x${string}`, maxWei, dailyWei],
    } as any)
    await publicClient.waitForTransactionReceipt({ hash: setPolicyHash })

    // Approve WETH
    const approveWethHash = await walletClient.writeContract({
      address: POLICY_CONTRACT,
      abi: ABI,
      functionName: 'approveToken',
      args: [agentAddress as `0x${string}`, WETH],
    } as any)
    await publicClient.waitForTransactionReceipt({ hash: approveWethHash })

    // Approve USDC
    const approveUsdcHash = await walletClient.writeContract({
      address: POLICY_CONTRACT,
      abi: ABI,
      functionName: 'approveToken',
      args: [agentAddress as `0x${string}`, USDC],
    } as any)
    await publicClient.waitForTransactionReceipt({ hash: approveUsdcHash })

    // Read back the policy to confirm
    const policy = await publicClient.readContract({
      address: POLICY_CONTRACT,
      abi: ABI,
      functionName: 'policies',
      args: [account.address, agentAddress as `0x${string}`],
    } as any)

    return NextResponse.json({
      success: true,
      agent: agentAddress,
      transactions: {
        setPolicy: setPolicyHash,
        approveWETH: approveWethHash,
        approveUSDC: approveUsdcHash,
      },
      policy: {
        maxTradeSize: String(maxTradeSize),
        dailyLimit: String(dailyLimit),
        active: policy[2],
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
