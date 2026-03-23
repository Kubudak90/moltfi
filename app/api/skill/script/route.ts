import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const scriptPath = join(process.cwd(), 'skill', 'scripts', 'moltfi.sh')
    const content = readFileSync(scriptPath, 'utf-8')
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'application/x-shellscript; charset=utf-8',
        'Content-Disposition': 'attachment; filename="moltfi.sh"'
      }
    })
  } catch {
    return NextResponse.json({ error: 'Script not found' }, { status: 404 })
  }
}
