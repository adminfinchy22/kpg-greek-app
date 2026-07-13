import { describe, expect, it } from 'vitest'
import { wantsNounDeclension } from './vocabFormsPolicy'

describe('wantsNounDeclension', () => {
  it('treats untagged legacy vocab rows as noun-like', () => {
    expect(wantsNounDeclension(null)).toBe(true)
    expect(wantsNounDeclension(undefined)).toBe(true)
    expect(wantsNounDeclension('noun')).toBe(true)
  })

  it('excludes non-noun parts of speech from noun forms', () => {
    expect(wantsNounDeclension('verb')).toBe(false)
    expect(wantsNounDeclension('adv')).toBe(false)
    expect(wantsNounDeclension('expression')).toBe(false)
    expect(wantsNounDeclension('num')).toBe(false)
  })
})
