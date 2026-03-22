/**
 * Simple transaction queue to prevent nonce collisions.
 * All server-side transactions go through this queue so they execute sequentially.
 */

let pending: Promise<any> = Promise.resolve()

export function queueTransaction<T>(fn: () => Promise<T>): Promise<T> {
  const next = pending.then(fn, fn) // run even if previous failed
  pending = next.catch(() => {}) // swallow so queue continues
  return next
}
