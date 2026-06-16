import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function readProjectFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

describe('critical regression safeguards', () => {
  it('keeps word_status under caller RLS and grants API access', () => {
    const sprint7a = readProjectFile('supabase/migrations/20260504120000_sprint_7a_catalog_schema.sql')
    const followUp = readProjectFile('supabase/migrations/20260616110500_fix_word_status_security_invoker.sql')

    expect(sprint7a).toMatch(
      /CREATE OR REPLACE VIEW public\.word_status\s+WITH\s*\(\s*security_invoker\s*=\s*true\s*\)\s+AS/i,
    )
    expect(sprint7a).toMatch(/GRANT SELECT ON public\.word_status TO anon, authenticated;/i)
    expect(followUp).toMatch(/ALTER VIEW public\.word_status SET\s*\(\s*security_invoker\s*=\s*true\s*\);/i)
    expect(followUp).toMatch(/GRANT SELECT ON public\.word_status TO anon, authenticated;/i)
  })

  it('does not close completed training before progress is saved', () => {
    const app = readProjectFile('src/App.tsx')
    const trainingSession = readProjectFile('src/components/TrainingSession.tsx')
    const useProgress = readProjectFile('src/hooks/useProgress.ts')

    expect(app).not.toMatch(/catch\s*\{\s*\/\*\s*non-fatal\s*\*\/\s*\}/)
    expect(app).toMatch(/onComplete=\{onTrainingDone\}/)
    expect(trainingSession).toMatch(/await onComplete\(words\.map\(\(w\) => w\.id\)\)/)
    expect(trainingSession).toMatch(/setSaveError/)
    expect(useProgress).toMatch(/fetchProgress\(\{ silent: true \}\)/)
  })
})
