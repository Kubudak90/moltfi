import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'data', 'strategies.json')

type Strategy = {
  name: string
  description: string
  expectedYield: string
  steps: string[]
  guardrails: {
    maxTradeSize: string
    dailyLimit: string
    maxSlippage?: string
    protocols: string[]
  }
  activatedAt: string
}

function loadStrategies(): Record<string, Strategy> {
  try {
    if (existsSync(DB_PATH)) return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } catch {}
  return {}
}

function saveStrategies(data: Record<string, Strategy>) {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// GET — read active strategy for a vault
export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  if (!vault) return NextResponse.json({ error: 'vault param required' }, { status: 400 })

  const strategies = loadStrategies()
  const strategy = strategies[vault.toLowerCase()] || null

  return NextResponse.json({ vault, strategy })
}

// POST — save active strategy for a vault
export async function POST(req: NextRequest) {
  try {
    const { vault, strategy } = await req.json()
    if (!vault || !strategy) {
      return NextResponse.json({ error: 'vault and strategy required' }, { status: 400 })
    }

    const strategies = loadStrategies()
    strategies[vault.toLowerCase()] = {
      ...strategy,
      activatedAt: new Date().toISOString(),
    }
    saveStrategies(strategies)

    return NextResponse.json({ saved: true, vault, strategy: strategies[vault.toLowerCase()] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE — clear strategy (when pausing agent)
export async function DELETE(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  if (!vault) return NextResponse.json({ error: 'vault param required' }, { status: 400 })

  const strategies = loadStrategies()
  delete strategies[vault.toLowerCase()]
  saveStrategies(strategies)

  return NextResponse.json({ cleared: true, vault })
}
