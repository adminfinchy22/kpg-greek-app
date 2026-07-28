import { describe, expect, it } from 'vitest'
import { pickTrainingWords } from './pickTrainingWords'
import type { VocabEntry } from '../types'

function word(id: number, greek = `w${id}`): VocabEntry {
  return {
    id,
    greek,
    russian: `r${id}`,
    topic_id: 1,
    notes: null,
    pos: null,
    semantic_group: null,
  }
}

describe('pickTrainingWords', () => {
  const topic = [word(1), word(2), word(3), word(4), word(5)]

  it('uses due words when at least `limit` are due', () => {
    const due = [word(2), word(4), word(5), word(1)]
    expect(pickTrainingWords(due, topic, 3).map((w) => w.id)).toEqual([2, 4, 5])
  })

  it('keeps 1–2 due words and fills from the rest of the topic', () => {
    const due = [word(4), word(1)]
    const picked = pickTrainingWords(due, topic, 3)
    expect(picked).toHaveLength(3)
    expect(picked.slice(0, 2).map((w) => w.id)).toEqual([4, 1])
    expect(new Set(picked.map((w) => w.id)).size).toBe(3)
    for (const w of picked) {
      expect(topic.some((t) => t.id === w.id)).toBe(true)
    }
  })

  it('keeps a single due word and fills up to limit', () => {
    const due = [word(3)]
    const picked = pickTrainingWords(due, topic, 3)
    expect(picked).toHaveLength(3)
    expect(picked[0]!.id).toBe(3)
    expect(picked.map((w) => w.id)).not.toContain(duplicatedIds(picked))
  })

  it('shuffles the full topic when nothing is due', () => {
    const picked = pickTrainingWords([], topic, 3)
    expect(picked).toHaveLength(3)
    for (const w of picked) {
      expect(topic.some((t) => t.id === w.id)).toBe(true)
    }
  })

  it('returns empty when the topic has no words', () => {
    expect(pickTrainingWords([word(1)], [], 3)).toEqual([])
  })
})

function duplicatedIds(words: { id: number }[]): number | undefined {
  const seen = new Set<number>()
  for (const w of words) {
    if (seen.has(w.id)) return w.id
    seen.add(w.id)
  }
  return undefined
}
