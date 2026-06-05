import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

function normalizedSqlAfterLastWordStatusDefinition(): string {
  const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()
  const combined = files.map((file) => readFileSync(join(migrationsDir, file), 'utf8')).join('\n')
  const matches = [...combined.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+public\.word_status\b/gi)]
  const lastDefinition = matches.at(-1)

  expect(lastDefinition, 'word_status view definition should exist in migrations').toBeDefined()

  return combined.slice(lastDefinition?.index ?? 0)
}

describe('word_status view security', () => {
  it('keeps security_invoker enabled after the latest view definition', () => {
    const sql = normalizedSqlAfterLastWordStatusDefinition()

    expect(sql).toMatch(
      /(?:WITH\s*\(\s*security_invoker\s*=\s*(?:true|on)\s*\)|ALTER\s+VIEW\s+public\.word_status\s+SET\s*\(\s*security_invoker\s*=\s*(?:true|on)\s*\))/i,
    )
  })
})
