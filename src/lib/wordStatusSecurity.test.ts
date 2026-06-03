import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDir = resolve(process.cwd(), 'supabase', 'migrations')

function migrationSql(): string {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => `-- ${name}\n${readFileSync(resolve(migrationsDir, name), 'utf8')}`)
    .join('\n')
}

function lastMatchIndex(sql: string, pattern: RegExp): number {
  let last = -1
  for (const match of sql.matchAll(pattern)) {
    last = match.index ?? last
  }
  return last
}

describe('word_status migration security', () => {
  it('keeps the exposed view running as security invoker', () => {
    const sql = migrationSql()
    const lastWordStatusCreate = lastMatchIndex(
      sql,
      /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+public\.word_status\b/gi,
    )
    const lastSecurityInvokerCreate = lastMatchIndex(
      sql,
      /CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+public\.word_status\s+WITH\s*\(\s*security_invoker\s*=\s*true\s*\)\s+AS\b/gi,
    )
    const lastSecurityInvokerChange = lastMatchIndex(
      sql,
      /ALTER\s+VIEW\s+public\.word_status\s+SET\s*\(\s*security_invoker\s*=\s*true\s*\)/gi,
    )
    const lastSecurityInvoker = Math.max(lastSecurityInvokerCreate, lastSecurityInvokerChange)

    expect(lastWordStatusCreate).toBeGreaterThanOrEqual(0)
    expect(lastSecurityInvoker).toBeGreaterThanOrEqual(lastWordStatusCreate)
  })
})
