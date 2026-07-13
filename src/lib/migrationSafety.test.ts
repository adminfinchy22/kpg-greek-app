import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readMigration(name: string): string {
  return readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8')
}

describe('Supabase migration safety', () => {
  it('keeps word_status under caller RLS permissions', () => {
    const original = readMigration('20260504120000_sprint_7a_catalog_schema.sql')
    const forward = readMigration('20260713110000_fix_word_status_security_invoker.sql')

    expect(original).toMatch(/CREATE OR REPLACE VIEW public\.word_status\s+WITH\s*\(\s*security_invoker\s*=\s*true\s*\)/)
    expect(forward).toMatch(/ALTER VIEW public\.word_status SET \(\s*security_invoker\s*=\s*true\s*\)/)
    expect(original).toMatch(/GRANT SELECT ON public\.word_status TO anon, authenticated/)
  })

  it('preserves progress before deleting duplicate vocab rows', () => {
    const sql = readMigration('20260502140000_sprint_6a_verb_schema_and_cleanup.sql')
    const moveProgress = sql.indexOf('SET vocab_id = id_keep')
    const mergeProgress = sql.indexOf('review_count = GREATEST')
    const deleteProgress = sql.indexOf('DELETE FROM user_progress WHERE vocab_id = id_drop')

    expect(moveProgress).toBeGreaterThan(-1)
    expect(mergeProgress).toBeGreaterThan(moveProgress)
    expect(sql).toMatch(/last_reviewed = CASE/)
    expect(deleteProgress).toBeGreaterThan(mergeProgress)
  })

  it('backfills noun forms for untagged rows that the app treats as nouns', () => {
    const original = readMigration('20260506120000_noun_forms_heuristic_backfill.sql')
    const forward = readMigration('20260713110100_backfill_untagged_noun_forms.sql')

    expect(original).toContain("WHERE (v.pos = 'noun' OR v.pos IS NULL)")
    expect(forward).toContain("WHERE (v.pos = 'noun' OR v.pos IS NULL)")
  })
})
