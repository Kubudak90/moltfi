import { NextRequest, NextResponse } from 'next/server'

// Agent-side deposit — returns the transaction data needed to deposit ETH into a vault
// The agent must sign and submit this transaction themselves
export async function POST(req: NextRequest) {
  try {
    const { vault, amount, agentWallet } = await req.json()
    if (!vault || !amount || !agentWallet) {
      return NextResponse.json({ error: 'vault, amount, agentWallet required' }, { status: 400 })
    }

    // Return unsigned transaction data for the agent to sign
    return NextResponse.json({
      transaction: {
        to: vault,
        value: `0x${BigInt(Math.floor(parseFloat(amount) * 1e18)).toString(16)}`,
        data: '0xf6326fb3', // depositETH() selector
        chainId: 84532,
        from: agentWallet,
      },
      note: 'Sign and broadcast this transaction to deposit ETH into the vault.',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
