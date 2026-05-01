import { describe, expect, it } from 'vitest'
import type { Phrase, Topic } from '../types'
import {
  buildNormalizedTopicNameById,
  filterGroupedPhrasesByTopicSelection,
  phraseCountByTopicId,
  sumGroupedPhraseCounts,
} from './phraseTopic'

describe('phraseTopic helpers', () => {
  const topics: Topic[] = [
    { id: 1, name_ru: '  Привет  ', sort_order: 1 },
    { id: 2, name_ru: 'Другое', sort_order: 2 },
  ]

  const grouped: Record<string, Phrase[]> = {
    привет: [{ id: 1, topic: 'привет', pattern: 'a', translation: 'b', examiner_q: null, examiner_q_ru: null, sort_order: 0 }],
    другое: [
      { id: 2, topic: 'другое', pattern: 'c', translation: 'd', examiner_q: null, examiner_q_ru: null, sort_order: 0 },
      { id: 3, topic: 'другое', pattern: 'e', translation: 'f', examiner_q: null, examiner_q_ru: null, sort_order: 1 },
    ],
  }

  it('buildNormalizedTopicNameById trims and lowercases', () => {
    const map = buildNormalizedTopicNameById(topics)
    expect(map.get(1)).toBe('привет')
    expect(map.get(2)).toBe('другое')
  })

  it('filterGroupedPhrasesByTopicSelection keeps one bucket when topic matches', () => {
    const map = buildNormalizedTopicNameById(topics)
    const filtered = filterGroupedPhrasesByTopicSelection(grouped, 1, map)
    expect(Object.keys(filtered)).toEqual(['привет'])
    expect(filtered['привет']).toHaveLength(1)
  })

  it('filterGroupedPhrasesByTopicSelection returns {} for unknown topic id', () => {
    const map = new Map<number, string>()
    const filtered = filterGroupedPhrasesByTopicSelection(grouped, 99, map)
    expect(filtered).toEqual({})
  })

  it('phraseCountByTopicId maps topic rows to ids by normalized Russian name', () => {
    const counts = phraseCountByTopicId(grouped, topics)
    expect(counts[1]).toBe(1)
    expect(counts[2]).toBe(2)
  })

  it('sumGroupedPhraseCounts sums phrase rows', () => {
    expect(sumGroupedPhraseCounts(grouped)).toBe(3)
  })
})
