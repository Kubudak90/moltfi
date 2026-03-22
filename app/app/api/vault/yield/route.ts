import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, formatEther, parseAbi } from 'viem'
import { baseSepolia } from 'viem/chains'

const client = createPublicClient({ chain: baseSepolia, transport: http() })

export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  if (!vault) {
    return NextResponse.json({ error: 'vault address required' }, { status: 400 })
  }

  try {
    // Use raw eth_call to avoid viem type issues
    const yieldData = await client.call({
      to: vault as `0x${string}`,
      data: '0x19e64847', // availableYield() selector
    }).catch(() => ({ data: '0x0' }))

    const principalData = await client.call({
      to: vault as `0x${string}`,
      data: '0xba5d3078', // principal() selector  
    }).catch(() => ({ data: '0x0' }))

    const yieldVal = yieldData.data && yieldData.data !== '0x' ? BigInt(yieldData.data) : BigInt(0)
    const principalVal = principalData.data && principalData.data !== '0x' ? BigInt(principalData.data) : BigInt(0)

    return NextResponse.json({
      vault,
      principal: formatEther(principalVal),
      availableYield: formatEther(yieldVal),
      note: 'Available yield is the amount above principal that the agent can trade freely.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
