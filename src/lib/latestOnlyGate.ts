export type LatestOnlyGate = {
  /** Begin a new attempt; returns a token for this attempt. */
  next: () => number
  /** True only if no newer attempt has started since `token`. */
  isCurrent: (token: number) => boolean
}

/**
 * Ignore stale async completions when a newer attempt has already started
 * (latest-wins). Useful for double-clicks that kick off overlapping fetches.
 */
export function createLatestOnlyGate(): LatestOnlyGate {
  let seq = 0
  return {
    next() {
      seq += 1
      return seq
    },
    isCurrent(token) {
      return token === seq
    },
  }
}
