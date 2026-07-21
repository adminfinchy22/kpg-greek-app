import { describe, expect, it } from 'vitest'
import { createKeyedSingleFlight } from './keyedSingleFlight'

describe('createKeyedSingleFlight', () => {
  it('blocks an overlapping mutation for the same key', () => {
    const flights = createKeyedSingleFlight<number>()

    expect(flights.start(42)).toBe(true)
    expect(flights.start(42)).toBe(false)
  })

  it('allows other keys and releases completed keys', () => {
    const flights = createKeyedSingleFlight<number>()

    expect(flights.start(1)).toBe(true)
    expect(flights.start(2)).toBe(true)

    flights.finish(1)

    expect(flights.start(1)).toBe(true)
    expect(flights.start(2)).toBe(false)
  })
})
