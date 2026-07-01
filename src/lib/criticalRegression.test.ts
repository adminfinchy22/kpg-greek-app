import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { saveTrainingProgress, TRAINING_SAVE_ERROR } from './trainingCompletion'

const root = process.cwd()

describe('critical regression safeguards', () => {
  it('keeps the training session open when progress saving fails', async () => {
    const save = vi.fn<() => Promise<void>>().mockRejectedValue(new Error('network unavailable'))

    await expect(saveTrainingProgress(save, [1, 2, 3])).resolves.toBe(TRAINING_SAVE_ERROR)
    expect(save).toHaveBeenCalledWith([1, 2, 3])
  })

  it('reports successful training progress saves without an error', async () => {
    const save = vi.fn<() => Promise<void>>().mockResolvedValue(undefined)

    await expect(saveTrainingProgress(save, [4])).resolves.toBeNull()
    expect(save).toHaveBeenCalledWith([4])
  })

  it('preserves duplicate word progress before deleting the dropped vocab row', () => {
    const sql = readFileSync(
      join(root, 'supabase/migrations/20260502140000_sprint_6a_verb_schema_and_cleanup.sql'),
      'utf8',
    )

    expect(sql).toContain('UPDATE public.user_progress\n        SET vocab_id = id_keep')
    expect(sql).toContain('bool_or(COALESCE(known, false)) AS known')
    expect(sql).toContain('GREATEST(COALESCE(keep_progress.review_count, 0), dropped_progress.review_count)')
    expect(sql.indexOf('SET vocab_id = id_keep')).toBeLessThan(
      sql.indexOf('DELETE FROM user_progress WHERE vocab_id = id_drop'),
    )
  })

  it('creates word_status as a security invoker view for PostgREST callers', () => {
    const sql = readFileSync(
      join(root, 'supabase/migrations/20260504120000_sprint_7a_catalog_schema.sql'),
      'utf8',
    )

    expect(sql).toMatch(/CREATE OR REPLACE VIEW public\.word_status\s+WITH \(security_invoker = true\) AS/)
    expect(sql).toContain('GRANT SELECT ON public.word_status TO anon, authenticated;')
  })
})
