import { shuffleCopy } from './shuffle'
import type { VocabEntry } from '../types'

/**
 * Prefer due words for a topic training session; fill with other topic words
 * when fewer than `limit` are due. Never drops due items just because the due
 * count is below the session size.
 */
export function pickTrainingWords(
  dueWords: VocabEntry[],
  topicVocab: VocabEntry[],
  limit = 3,
): VocabEntry[] {
  if (limit <= 0 || topicVocab.length === 0) return []

  if (dueWords.length >= limit) {
    return dueWords.slice(0, limit)
  }

  if (dueWords.length === 0) {
    return shuffleCopy(topicVocab).slice(0, limit)
  }

  const dueIds = new Set(dueWords.map((w) => w.id))
  const fillers = shuffleCopy(topicVocab.filter((w) => !dueIds.has(w.id)))
  return [...dueWords, ...fillers].slice(0, limit)
}
