import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(req: NextRequest) {
  try {
    const skillPath = join(process.cwd(), '..', 'skill', 'SKILL.md')
    let content = readFileSync(skillPath, 'utf-8')

    // Replace placeholder domain with the actual host so agents can use the skill directly
    const host = req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    if (host) {
      const baseUrl = `${proto}://${host}`
      content = content.replace(/https:\/\/moltfi\.app/g, baseUrl)
    }

    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    })
  } catch {
    return new NextResponse('# MoltFi Skill\n\nSee https://github.com/ortegarod/moltfi/blob/main/skill/SKILL.md', {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    })
  }
}
