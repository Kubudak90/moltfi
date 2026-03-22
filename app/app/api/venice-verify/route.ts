import { NextRequest, NextResponse } from 'next/server'
import { createChallenge, getChallenge, deleteChallenge, issueToken, getTokenInfo, CHALLENGE_TTL } from '../../../lib/venice-tokens'

export const dynamic = 'force-dynamic'

/**
 * Venice Verification — Challenge-Response Protocol
 *
 * When Private Mode is on, another agent can't talk to MoltFi unless
 * they prove they're also running on Venice AI. Here's how:
 *
 * 1. Agent calls POST /api/venice-verify with { action: "challenge" }
 *    → Gets back a { challenge, expiresAt }
 *
 * 2. Agent must call Venice's API with the challenge as the prompt:
 *    POST https://api.venice.ai/api/v1/chat/completions
 *    { model: "llama-3.3-70b", messages: [{ role: "user", content: "MOLTFI_VERIFY:<challenge>" }] }
 *
 * 3. Agent calls POST /api/venice-verify with:
 *    { action: "prove", challenge, veniceResponse: <full Venice API response body> }
 *    → If valid, gets back a { token, expiresAt } good for 1 hour
 *
 * 4. Agent includes X-Venice-Token header on all /api/chat and /api/pipeline calls
 *
 * What this proves: the calling agent has a Venice API key and actually
 * routes inference through Venice. No Venice = no access.
 */

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'challenge') {
    const { challenge, expiresAt } = createChallenge()

    return NextResponse.json({
      challenge,
      expiresAt: new Date(expiresAt).toISOString(),
      instruction: `Call Venice API with this prompt: "MOLTFI_VERIFY:${challenge}" — then POST back here with { action: "prove", challenge: "${challenge}", veniceResponse: <full response body> }`,
      veniceSetup: 'https://docs.openclaw.ai/providers/venice',
    })
  }

  if (action === 'prove') {
    const { challenge, veniceResponse } = body

    // Validate challenge exists and hasn't expired
    const ch = getChallenge(challenge)
    if (!ch) {
      return NextResponse.json({ error: 'Invalid or expired challenge. Request a new one.' }, { status: 400 })
    }
    if (ch.expiresAt < Date.now()) {
      deleteChallenge(challenge)
      return NextResponse.json({ error: 'Challenge expired. Request a new one.' }, { status: 400 })
    }

    // Validate the Venice response
    if (!veniceResponse || typeof veniceResponse !== 'object') {
      return NextResponse.json({ error: 'veniceResponse must be the full Venice API response body (JSON object)' }, { status: 400 })
    }

    // Check Venice response structure
    const valid = validateVeniceResponse(veniceResponse, challenge)
    if (!valid.ok) {
      return NextResponse.json({
        error: `Venice verification failed: ${valid.reason}`,
        hint: 'Make sure you called Venice API with the exact prompt "MOLTFI_VERIFY:<challenge>" and returned the full response body.',
        veniceSetup: 'https://docs.openclaw.ai/providers/venice',
      }, { status: 403 })
    }

    // Challenge passed — issue a token
    deleteChallenge(challenge)
    const { token, expiresAt } = issueToken(veniceResponse.id || 'unknown')

    return NextResponse.json({
      verified: true,
      token,
      expiresAt: new Date(expiresAt).toISOString(),
      note: 'Include this token as X-Venice-Token header on /api/chat and /api/pipeline calls.',
    })
  }

  return NextResponse.json({ error: 'action must be "challenge" or "prove"' }, { status: 400 })
}

// GET — check if a token is still valid
export async function GET(req: NextRequest) {
  const tokenParam = req.nextUrl.searchParams.get('token')
  if (!tokenParam) return NextResponse.json({ error: 'token param required' }, { status: 400 })

  const info = getTokenInfo(tokenParam)
  if (!info || info.expiresAt < Date.now()) {
    return NextResponse.json({ valid: false })
  }
  return NextResponse.json({ valid: true, expiresAt: new Date(info.expiresAt).toISOString() })
}

/**
 * Validates that a response actually came from Venice's API.
 * Checks structure, model name, and that the content references our challenge.
 */
function validateVeniceResponse(resp: any, challenge: string): { ok: boolean; reason?: string } {
  if (!resp.id || typeof resp.id !== 'string') {
    return { ok: false, reason: 'Missing response id — not a valid Venice API response' }
  }

  if (!resp.choices || !Array.isArray(resp.choices) || resp.choices.length === 0) {
    return { ok: false, reason: 'Missing choices array — not a valid Venice API response' }
  }

  // Check that the response content references our challenge nonce
  const content = resp.choices[0]?.message?.content || ''
  if (!content.includes(challenge.slice(0, 8))) {
    return { ok: false, reason: 'Response does not reference the challenge nonce — may be a recycled response' }
  }

  // Check model is a Venice-hosted model
  const model = (resp.model || '').toLowerCase()
  const veniceModels = ['llama', 'mistral', 'dolphin', 'qwen', 'deepseek', 'nous', 'venice']
  const isVeniceModel = veniceModels.some(m => model.includes(m))
  if (!isVeniceModel && !model.includes('gpt')) {
    return { ok: false, reason: `Model "${resp.model}" is not a recognized Venice-hosted model` }
  }

  return { ok: true }
}
