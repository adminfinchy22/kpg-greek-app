import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

describe('Supabase migrations', () => {
  it('keeps word_status as a security invoker view', () => {
    const migrationsDir = fileURLToPath(new URL('../../supabase/migrations/', import.meta.url))
    const sql = readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort()
      .map((name) => readFileSync(join(migrationsDir, name), 'utf8'))
      .join('\n')

    expect(sql).toMatch(
      /(?:ALTER\s+VIEW\s+public\.word_status\s+SET\s*\([^)]*security_invoker\s*=\s*true|CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.word_status\s+WITH\s*\([^)]*security_invoker\s*=\s*true)/i,
    )
  })
})
