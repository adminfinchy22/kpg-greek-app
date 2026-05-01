import { describe, expect, it } from 'vitest'
import type { VocabEntry } from '../types'
import { buildTestQuestion } from './testQuestion'

function entry(id: number, topicId = 1): VocabEntry {
  return {
    id,
    greek: `g${id}`,
    russian: `r${id}`,
    topic_id: topicId,
    notes: null,
  }
}

describe('buildTestQuestion', () => {
  it('returns null when fewer than 4 entries', () => {
    expect(buildTestQuestion([entry(1), entry(2), entry(3)])).toBeNull()
  })

  it('returns four options including the correct answer', () => {
    const pool = [entry(10), entry(11), entry(12), entry(13)]
    const q = buildTestQuestion(pool)
    expect(q).not.toBeNull()
    expect(q!.opts).toHaveLength(4)
    expect(q!.opts.map((o) => o.id).sort((a, b) => a - b)).toEqual([10, 11, 12, 13])
    expect(q!.opts.some((o) => o.id === q!.correct.id)).toBe(true)
  })
})
