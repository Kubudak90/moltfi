import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'data', 'private-mode.json')

function load(): Record<string, boolean> {
  try {
    if (existsSync(DB_PATH)) return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } catch {}
  return {}
}

function save(data: Record<string, boolean>) {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// GET — check if private mode is active for a vault
export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  if (!vault) return NextResponse.json({ error: 'vault required' }, { status: 400 })
  const data = load()
  return NextResponse.json({ vault, privateMode: !!data[vault.toLowerCase()] })
}

// POST — toggle private mode
export async function POST(req: NextRequest) {
  const { vault, enabled } = await req.json()
  if (!vault || typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'vault and enabled (boolean) required' }, { status: 400 })
  }
  const data = load()
  data[vault.toLowerCase()] = enabled
  save(data)
  return NextResponse.json({
    vault,
    privateMode: enabled,
    note: enabled
      ? 'Private Mode active. All AI inference for this vault must go through Venice (zero data retention). Direct strategy calls without Venice will be rejected.'
      : 'Private Mode disabled. AI inference can use any provider.',
  })
}
