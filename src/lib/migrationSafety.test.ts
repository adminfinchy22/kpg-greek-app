import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migrationsDir = new URL('../../supabase/migrations/', import.meta.url)

function readMigrationChain(): string {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => readFileSync(new URL(name, migrationsDir), 'utf8'))
    .join('\n\n')
}

describe('migration safety invariants', () => {
  it('keeps word_status as a security_invoker view exposed to app roles', () => {
    const sql = readMigrationChain()
    const viewDefinitions = [...sql.matchAll(/CREATE\s+OR\s+REPLACE\s+VIEW\s+public\.word_status[\s\S]*?AS\s+SELECT/gi)]

    expect(viewDefinitions.length).toBeGreaterThan(0)
    for (const definition of viewDefinitions) {
      expect(definition[0]).toMatch(/WITH\s*\(\s*security_invoker\s*=\s*true\s*\)/i)
    }
    expect(sql).toMatch(/GRANT\s+SELECT\s+ON\s+public\.word_status\s+TO\s+anon\s*,\s*authenticated/i)
  })
})
