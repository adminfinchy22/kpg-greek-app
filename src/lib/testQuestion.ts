import { shuffleCopy } from './shuffle'
import type { VocabEntry, TestQuestion } from '../types'

export function buildTestQuestion(vocab: VocabEntry[]): TestQuestion | null {
  if (vocab.length < 4) return null
  const shuffled = shuffleCopy(vocab)
  const correct = shuffled[0]!
  const opts = shuffleCopy([...shuffled.slice(1, 4), correct])
  return { correct, opts }
}
