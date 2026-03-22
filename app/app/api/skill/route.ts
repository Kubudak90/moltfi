import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    // Serve the skill.md file from the repo root
    const skillPath = join(process.cwd(), '..', 'skill', 'SKILL.md')
    const content = readFileSync(skillPath, 'utf-8')
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    })
  } catch {
    return new NextResponse('# ClawFi Skill\n\nSee https://github.com/ortegarod/clawfi/blob/main/skill/SKILL.md', {
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
    })
  }
}
