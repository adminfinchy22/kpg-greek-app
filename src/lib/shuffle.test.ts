import { describe, expect, it } from 'vitest'
import { shuffleCopy } from './shuffle'

describe('shuffleCopy', () => {
  it('returns empty for empty input', () => {
    expect(shuffleCopy([])).toEqual([])
  })

  it('preserves length and multiset', () => {
    const input = [1, 2, 3, 2, 1]
    const out = shuffleCopy(input)
    expect(out).toHaveLength(input.length)
    expect([...out].sort((a, b) => a - b)).toEqual([...input].sort((a, b) => a - b))
  })

  it('does not mutate the source array', () => {
    const input = [1, 2, 3]
    const copy = [...input]
    shuffleCopy(input)
    expect(input).toEqual(copy)
  })
})
