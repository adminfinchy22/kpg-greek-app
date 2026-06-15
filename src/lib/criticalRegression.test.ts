import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

function readRepoFile(path: string): string {
  return readFileSync(resolve(root, path), 'utf8')
}

function expectSecurityInvokerWordStatus(sql: string) {
  expect(sql).toMatch(
    /CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.word_status\s+WITH\s*\(\s*security_invoker\s*=\s*true\s*\)\s+AS/i,
  )
  expect(sql).toMatch(/GRANT\s+SELECT\s+ON\s+public\.word_status\s+TO\s+anon,\s+authenticated/i)
}

describe('critical regression guards', () => {
  it('keeps training completion saves awaited and retryable', () => {
    const app = readRepoFile('src/App.tsx')
    const trainingSession = readRepoFile('src/components/TrainingSession.tsx')

    expect(app).toContain('await recordTrainingReview(ids)')
    expect(app).not.toContain('/* non-fatal */')
    expect(app).not.toMatch(/void\s+onTrainingDone\(ids\)/)

    expect(trainingSession).toContain('onComplete: (vocabIds: number[]) => Promise<void> | void')
    expect(trainingSession).toContain('await onComplete(words.map((w) => w.id))')
    expect(trainingSession).toContain('setSaveError(')
  })

  it('keeps word_status RLS-safe for fresh and existing databases', () => {
    expectSecurityInvokerWordStatus(readRepoFile('supabase/migrations/20260504120000_sprint_7a_catalog_schema.sql'))
    expectSecurityInvokerWordStatus(readRepoFile('supabase/migrations/20260615110500_fix_word_status_security_invoker.sql'))
  })
})
