export type KeyedSingleFlight<K> = {
  start: (key: K) => boolean
  finish: (key: K) => void
}

/**
 * Prevent overlapping mutations for the same entity while allowing unrelated
 * entities to save concurrently.
 */
export function createKeyedSingleFlight<K>(): KeyedSingleFlight<K> {
  const pending = new Set<K>()

  return {
    start(key) {
      if (pending.has(key)) return false
      pending.add(key)
      return true
    },
    finish(key) {
      pending.delete(key)
    },
  }
}
