import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  new URL(
    '../../supabase/migrations/20260502140001_sprint_6a_verb_forms_backfill.sql',
    import.meta.url,
  ),
  'utf8',
)

describe('verb forms backfill migration', () => {
  it('repairs a legacy table before referencing Sprint 6A columns', () => {
    const legacyShapeCheck = migration.indexOf("c.column_name = 'person'")
    const tableRebuild = migration.indexOf('DROP TABLE IF EXISTS public.verb_forms CASCADE')
    const presentRowsDelete = migration.indexOf(
      "DELETE FROM public.verb_forms WHERE tense = 'present'",
    )

    expect(legacyShapeCheck).toBeGreaterThan(-1)
    expect(tableRebuild).toBeGreaterThan(legacyShapeCheck)
    expect(presentRowsDelete).toBeGreaterThan(tableRebuild)
    expect(migration).toContain('CREATE TABLE IF NOT EXISTS public.verb_forms')
  })
})
