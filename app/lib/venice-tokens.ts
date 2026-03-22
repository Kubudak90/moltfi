import { randomBytes } from 'crypto'

// Shared token/challenge stores used by venice-verify route and chat/pipeline routes
// In-memory for demo — production would use Redis/DB

const challenges = new Map<string, { expiresAt: number }>()
const tokens = new Map<string, { expiresAt: number; issuedTo: string }>()

export const CHALLENGE_TTL = 5 * 60 * 1000  // 5 minutes
export const TOKEN_TTL = 60 * 60 * 1000     // 1 hour

function cleanup() {
  const now = Date.now()
  challenges.forEach((v, k) => { if (v.expiresAt < now) challenges.delete(k) })
  tokens.forEach((v, k) => { if (v.expiresAt < now) tokens.delete(k) })
}

export function createChallenge(): { challenge: string; expiresAt: number } {
  cleanup()
  const challenge = randomBytes(16).toString('hex')
  const expiresAt = Date.now() + CHALLENGE_TTL
  challenges.set(challenge, { expiresAt })
  return { challenge, expiresAt }
}

export function getChallenge(challenge: string): { expiresAt: number } | undefined {
  cleanup()
  return challenges.get(challenge)
}

export function deleteChallenge(challenge: string) {
  challenges.delete(challenge)
}

export function issueToken(issuedTo: string): { token: string; expiresAt: number } {
  cleanup()
  const token = randomBytes(32).toString('hex')
  const expiresAt = Date.now() + TOKEN_TTL
  tokens.set(token, { expiresAt, issuedTo })
  return { token, expiresAt }
}

export function verifyToken(token: string | null): boolean {
  if (!token) return false
  cleanup()
  const t = tokens.get(token)
  return !!t && t.expiresAt > Date.now()
}

export function getTokenInfo(token: string): { expiresAt: number; issuedTo: string } | undefined {
  cleanup()
  return tokens.get(token)
}
