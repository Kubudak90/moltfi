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

  const ensName = name.endsWith('.eth') ? name : `${name}.eth`

  try {
    const address = await mainnetClient.getEnsAddress({ name: ensName as `${string}.eth` })
    if (!address) {
      return NextResponse.json({ name: ensName, resolved: false })
    }

    const balance = await baseClient.getBalance({ address })

    let avatar: string | null = null
    try {
      avatar = await mainnetClient.getEnsAvatar({ name: ensName as `${string}.eth` })
    } catch {}

    return NextResponse.json({
      name: ensName,
      resolved: true,
      address,
      baseBalance: formatEther(balance),
      avatar,
      source: 'live-ens',
    })
  } catch (e) {
    return NextResponse.json({ name: ensName, error: String(e) }, { status: 500 })
  }
}
