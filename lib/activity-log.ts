import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const LOG_PATH = join(process.cwd(), 'data', 'activity-summaries.json')

type SummaryLog = Record<string, string> // txHash → Venice AI summary

function readLog(): SummaryLog {
  if (!existsSync(LOG_PATH)) return {}
  try {
    return JSON.parse(readFileSync(LOG_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

export function saveActivitySummary(txHash: string, summary: string) {
  const log = readLog()
  log[txHash.toLowerCase()] = summary
  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2))
}

export function getActivitySummary(txHash: string): string | null {
  const log = readLog()
  return log[txHash.toLowerCase()] || null
}
