import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function migration(path: string) {
  return readFileSync(join(root, 'supabase', 'migrations', path), 'utf8')
}

describe('migration safety checks', () => {
  it('preserves duplicate vocab progress before deleting the dropped row', () => {
    const sql = migration('20260502140000_sprint_6a_verb_schema_and_cleanup.sql')
    const deleteIndex = sql.indexOf('DELETE FROM user_progress WHERE vocab_id = id_drop;')
    const moveProgressIndex = sql.indexOf('vocab_id = id_keep')
    const mergedReviewIndex = sql.indexOf('merged_review_count')
    const mergedLastReviewedIndex = sql.indexOf('merged_last_reviewed')

    expect(moveProgressIndex).toBeGreaterThan(0)
    expect(mergedReviewIndex).toBeGreaterThan(0)
    expect(mergedLastReviewedIndex).toBeGreaterThan(0)
    expect(deleteIndex).toBeGreaterThan(moveProgressIndex)
  })

  it('creates word_status as a security-invoker view in the original migration', () => {
    const sql = migration('20260504120000_sprint_7a_catalog_schema.sql')

    expect(sql).toMatch(/CREATE OR REPLACE VIEW public\.word_status\s+WITH\s*\(\s*security_invoker\s*=\s*true\s*\)\s+AS/i)
  })

  it('recreates word_status as a security-invoker view for existing databases', () => {
    const sql = migration('20260611110500_fix_word_status_security_invoker.sql')

    expect(sql).toMatch(/CREATE OR REPLACE VIEW public\.word_status\s+WITH\s*\(\s*security_invoker\s*=\s*true\s*\)\s+AS/i)
  })
})
