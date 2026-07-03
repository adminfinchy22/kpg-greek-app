import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { wantsNounDeclension } from './vocabFormsPolicy'

function migration(name: string): string {
  return readFileSync(new URL(`../../supabase/migrations/${name}`, import.meta.url), 'utf8')
}

function activeSql(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
}

describe('migration safety', () => {
  it('keeps noun_forms backfill aligned with untagged vocab policy', () => {
    expect(wantsNounDeclension(null)).toBe(true)

    const freshBackfill = activeSql(migration('20260506120000_noun_forms_heuristic_backfill.sql'))
    expect(freshBackfill).toMatch(/WHERE\s+\(\s*v\.pos\s*=\s*'noun'\s+OR\s+v\.pos\s+IS\s+NULL\s*\)/i)

    const appliedDbBackfill = activeSql(migration('20260703110700_backfill_untagged_noun_forms.sql'))
    expect(appliedDbBackfill).toMatch(/WHERE\s+v\.pos\s+IS\s+NULL/i)
    expect(appliedDbBackfill).toMatch(/ON\s+CONFLICT\s+\(vocab_id\)\s+DO\s+NOTHING/i)
  })

  it('creates word_status as a security-invoker view for RLS', () => {
    for (const name of [
      '20260504120000_sprint_7a_catalog_schema.sql',
      '20260703110500_fix_word_status_security_invoker.sql',
    ]) {
      const sql = activeSql(migration(name))
      expect(sql).toMatch(/CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.word_status\s+WITH\s+\(security_invoker\s*=\s*true\)\s+AS/i)
      expect(sql).toMatch(/GRANT\s+SELECT\s+ON\s+public\.word_status\s+TO\s+anon,\s+authenticated/i)
    }
  })

  it('merges duplicate vocab progress before deleting the dropped row', () => {
    for (const name of [
      '20260502140000_sprint_6a_verb_schema_and_cleanup.sql',
      '20260703110600_preserve_duplicate_vocab_progress.sql',
    ]) {
      const sql = activeSql(migration(name))
      const rehome = sql.indexOf('SET vocab_id = id_keep')
      const merge = sql.indexOf('review_count = GREATEST')
      const deleteProgress = sql.indexOf('DELETE FROM user_progress WHERE vocab_id = id_drop')

      expect(rehome).toBeGreaterThan(-1)
      expect(merge).toBeGreaterThan(-1)
      expect(deleteProgress).toBeGreaterThan(-1)
      expect(rehome).toBeLessThan(deleteProgress)
      expect(merge).toBeLessThan(deleteProgress)
    }
  })
})
