import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { wantsNounDeclension } from './vocabFormsPolicy'

const migrationsDir = resolve(process.cwd(), 'supabase/migrations')

function readMigration(fileName: string): string {
  return readFileSync(resolve(migrationsDir, fileName), 'utf8')
}

describe('migration safety checks', () => {
  it('backfills noun_forms for legacy untagged rows that the app displays as declinable', () => {
    expect(wantsNounDeclension(null)).toBe(true)

    const originalBackfill = readMigration('20260506120000_noun_forms_heuristic_backfill.sql')
    expect(originalBackfill).toContain("WHERE (v.pos = 'noun' OR v.pos IS NULL)")

    const followUpBackfill = readMigration('20260702110500_backfill_untagged_noun_forms.sql')
    expect(followUpBackfill).toContain('WHERE v.pos IS NULL')
    expect(followUpBackfill).toContain('ON CONFLICT (vocab_id) DO NOTHING')
  })
})
