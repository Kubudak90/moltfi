import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'data', 'strategies.json')

function load(): Record<string, any> {
  try {
    if (existsSync(DB_PATH)) return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } catch {}
  return {}
}

function save(data: Record<string, any>) {
  const dir = join(process.cwd(), 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

// GET — retrieve active strategy details for a vault
export async function GET(req: NextRequest) {
  const vault = req.nextUrl.searchParams.get('vault')
  if (!vault) return NextResponse.json({ error: 'vault required' }, { status: 400 })
  const data = load()
  const strategy = data[vault.toLowerCase()] || null
  return NextResponse.json({ vault, strategy })
}

// POST — save active strategy details for a vault
export async function POST(req: NextRequest) {
  const { vault, strategy } = await req.json()
  if (!vault) return NextResponse.json({ error: 'vault required' }, { status: 400 })
  const data = load()
  if (strategy) {
    data[vault.toLowerCase()] = {
      ...strategy,
      savedAt: new Date().toISOString(),
    }
  } else {
    delete data[vault.toLowerCase()]
  }
  save(data)
  return NextResponse.json({ vault, strategy: data[vault.toLowerCase()] || null })
}
