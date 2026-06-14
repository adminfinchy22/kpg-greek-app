import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readRepoFile(relativePath: string): string {
  return readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8')
}

describe('critical database migration safeguards', () => {
  const wordStatusViewPattern =
    /CREATE OR REPLACE VIEW public\.word_status\s+WITH\s*\(\s*security_invoker\s*=\s*true\s*\)\s+AS/i
  const wordStatusGrantPattern = /GRANT SELECT ON public\.word_status TO anon, authenticated;/i

  it('creates the Sprint 7A word_status view as an RLS-respecting PostgREST view', () => {
    const migration = readRepoFile('supabase/migrations/20260504120000_sprint_7a_catalog_schema.sql')

    expect(migration).toMatch(wordStatusViewPattern)
    expect(migration).toMatch(wordStatusGrantPattern)
  })

  it('repairs existing word_status views with invoker security and grants', () => {
    const migration = readRepoFile('supabase/migrations/20260614110500_fix_word_status_security_invoker.sql')

    expect(migration).toMatch(wordStatusViewPattern)
    expect(migration).toMatch(wordStatusGrantPattern)
    expect(migration).toContain('LEFT JOIN public.user_progress up ON up.vocab_id = v.id')
  })
})

describe('training progress persistence safeguards', () => {
  it('keeps the training results modal open until progress is saved', () => {
    const trainingSession = readRepoFile('src/components/TrainingSession.tsx')

    expect(trainingSession).toContain('onComplete: (vocabIds: number[]) => Promise<void>')
    expect(trainingSession).toContain('await onComplete(words.map((w) => w.id))')
    expect(trainingSession).toContain('Прогресс не сохранён')
  })

  it('does not swallow training progress save failures in App', () => {
    const app = readRepoFile('src/App.tsx')

    expect(app).toContain('await recordTrainingReview(ids)')
    expect(app).not.toMatch(/catch\s*\{\s*\/\* non-fatal \*\/\s*\}/)
  })

  it('refreshes progress silently after a training save', () => {
    const progressHook = readRepoFile('src/hooks/useProgress.ts')

    expect(progressHook).toContain('await fetchProgress({ silent: true })')
  })
})
