import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

async function source(path: string): Promise<string> {
  return readFile(join(root, path), 'utf8')
}

describe('critical regression guardrails', () => {
  it('keeps the training results modal open until progress save succeeds', async () => {
    const trainingSession = await source('src/components/TrainingSession.tsx')
    const awaitSave = trainingSession.indexOf('await onComplete(words.map((w) => w.id))')
    const closeAfterSave = trainingSession.indexOf('handleClose()', awaitSave)

    expect(trainingSession).toContain('onComplete: (vocabIds: number[]) => Promise<void> | void')
    expect(awaitSave).toBeGreaterThan(-1)
    expect(closeAfterSave).toBeGreaterThan(awaitSave)
    expect(trainingSession).toContain('setSaveError(')
    expect(trainingSession).toContain('disabled={saving}')
  })

  it('propagates training save errors instead of swallowing them in App', async () => {
    const app = await source('src/App.tsx')
    const handlerStart = app.indexOf('const onTrainingDone = useCallback(')
    const handlerEnd = app.indexOf('const shellStyle', handlerStart)
    const handler = app.slice(handlerStart, handlerEnd)

    expect(handler).toContain('await recordTrainingReview(ids)')
    expect(handler).not.toContain('catch')
    expect(handler).not.toContain('refetchProgress()')
  })

  it('refreshes progress silently after recording training reviews', async () => {
    const useProgress = await source('src/hooks/useProgress.ts')

    expect(useProgress).toContain('type FetchProgressOptions = { silent?: boolean }')
    expect(useProgress).toContain('async (options: FetchProgressOptions = {})')
    expect(useProgress).toContain('await fetchProgress({ silent: true })')
  })

  it('creates word_status as a security-invoker view in base and repair migrations', async () => {
    const baseMigration = await source('supabase/migrations/20260504120000_sprint_7a_catalog_schema.sql')
    const repairMigration = await source('supabase/migrations/20260705110500_fix_word_status_security_invoker.sql')

    for (const migration of [baseMigration, repairMigration]) {
      expect(migration).toMatch(/CREATE OR REPLACE VIEW public\.word_status\s+WITH \(security_invoker = true\) AS/)
      expect(migration).toContain('GRANT SELECT ON public.word_status TO anon, authenticated;')
    }
  })
})
