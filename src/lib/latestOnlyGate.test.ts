import { describe, expect, it } from 'vitest'
import { createLatestOnlyGate } from './latestOnlyGate'

describe('createLatestOnlyGate', () => {
  it('treats only the newest token as current', () => {
    const gate = createLatestOnlyGate()

    const first = gate.next()
    const second = gate.next()

    expect(gate.isCurrent(first)).toBe(false)
    expect(gate.isCurrent(second)).toBe(true)
  })

  it('keeps a single in-flight token current until superseded', () => {
    const gate = createLatestOnlyGate()
    const token = gate.next()

    expect(gate.isCurrent(token)).toBe(true)
    expect(gate.isCurrent(token + 1)).toBe(false)
  })
})
