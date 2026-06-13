import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { wantsNounDeclension } from './vocabFormsPolicy'

const untaggedBackfillSql = readFileSync(
  join(process.cwd(), 'supabase/migrations/20260613110500_backfill_untagged_noun_forms.sql'),
  'utf8',
)

describe('migration safety checks', () => {
  it('backfills noun_forms for untagged vocab rows that the app treats as declinable', () => {
    expect(wantsNounDeclension(null)).toBe(true)
    expect(untaggedBackfillSql).toMatch(/v\.pos\s+IS\s+NULL/)
    expect(untaggedBackfillSql).toMatch(/v\.pos\s*=\s*'noun'/)
  })

  it('does not overwrite existing curated noun_forms rows', () => {
    expect(untaggedBackfillSql).toMatch(/NOT\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+public\.noun_forms\s+nf\s+WHERE\s+nf\.vocab_id\s*=\s*v\.id\s*\)/)
    expect(untaggedBackfillSql).toMatch(/ON\s+CONFLICT\s*\(\s*vocab_id\s*\)\s+DO\s+NOTHING/)
  })
})
