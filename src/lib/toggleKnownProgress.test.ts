import { describe, expect, it } from 'vitest'
import { buildToggleKnownUpdate } from './toggleKnownProgress'

describe('buildToggleKnownUpdate', () => {
  const now = '2026-07-26T12:00:00.000Z'

  it('clears due_at when marking a word known', () => {
    expect(buildToggleKnownUpdate(false, 2, now)).toEqual({
      known: true,
      last_reviewed: now,
      review_count: 3,
      due_at: null,
    })
  })

  it('schedules due_at immediately when demoting a learned word', () => {
    expect(buildToggleKnownUpdate(true, 5, now)).toEqual({
      known: false,
      last_reviewed: now,
      review_count: 6,
      due_at: now,
    })
  })

  it('treats null review_count as zero', () => {
    expect(buildToggleKnownUpdate(true, null, now).review_count).toBe(1)
    expect(buildToggleKnownUpdate(false, undefined, now).review_count).toBe(1)
  })
})
