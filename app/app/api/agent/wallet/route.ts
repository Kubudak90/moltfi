import { NextResponse } from 'next/server'
import { privateKeyToAccount } from 'viem/accounts'

export const dynamic = 'force-dynamic'

// Returns the server's agent wallet address.
// This is the address that will act as the "agent" in vaults —
// it calls executeSwap() on behalf of the vault owner.
export async function GET() {
  const pk = process.env.AGENT_PRIVATE_KEY
  if (!pk) {
    return NextResponse.json({ agentWallet: null, error: 'Server not configured' }, { status: 503 })
  }

  const account = privateKeyToAccount(pk as `0x${string}`)
  return NextResponse.json({ agentWallet: account.address })
}
