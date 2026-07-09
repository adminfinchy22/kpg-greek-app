import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function readMigration(name: string): string {
  return readFileSync(resolve(process.cwd(), 'supabase/migrations', name), 'utf8')
}

describe('critical migration safety', () => {
  it('merges duplicate vocab progress before deleting the alias row', () => {
    const migrations = [
      readMigration('20260502140000_sprint_6a_verb_schema_and_cleanup.sql'),
      readMigration('20260709110500_fix_progress_merge_and_word_status_security.sql'),
    ]

    for (const sql of migrations) {
      expect(sql).toContain('bool_or(COALESCE(known, false)) AS known')
      expect(sql).toContain('MAX(COALESCE(review_count, 0)) AS review_count')
      expect(sql).toContain('MAX(last_reviewed) AS last_reviewed')

      const insertIndex = sql.indexOf('INSERT INTO public.user_progress')
      const deleteIndex = sql.search(/DELETE FROM (public\.)?user_progress WHERE vocab_id = id_drop/)
      expect(insertIndex).toBeGreaterThan(-1)
      expect(deleteIndex).toBeGreaterThan(insertIndex)
    }
  })

  it('creates word_status as a security invoker view with explicit grants', () => {
    const migrations = [
      readMigration('20260504120000_sprint_7a_catalog_schema.sql'),
      readMigration('20260709110500_fix_progress_merge_and_word_status_security.sql'),
    ]

    for (const sql of migrations) {
      expect(sql).toContain('CREATE OR REPLACE VIEW public.word_status WITH (security_invoker = true) AS')
      expect(sql).toContain('GRANT SELECT ON public.word_status TO anon, authenticated')
    }
  })
})
