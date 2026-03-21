import { NextResponse } from 'next/server'
import { createPublicClient, http, formatEther } from 'viem'
import { base, mainnet } from 'viem/chains'

const mainnetClient = createPublicClient({ chain: mainnet, transport: http('https://ethereum-rpc.publicnode.com') })
const baseClient = createPublicClient({ chain: base, transport: http('https://mainnet.base.org') })

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')

  if (!name) {
    return NextResponse.json({ error: 'Missing ?name= parameter' }, { status: 400 })
  }

  try {
    const address = await mainnetClient.getEnsAddress({ name: name as `${string}.eth` })
    if (!address) {
      return NextResponse.json({ name, resolved: false })
    }

    const balance = await baseClient.getBalance({ address })

    let reverseName: string | null = null
    try {
      reverseName = await mainnetClient.getEnsName({ address })
    } catch {}

    return NextResponse.json({
      name,
      resolved: true,
      address,
      reverseName,
      baseBalance: formatEther(balance),
    })
  } catch (e) {
    return NextResponse.json({ name, error: String(e) }, { status: 500 })
  }
}
