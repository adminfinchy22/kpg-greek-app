import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

function readMigrationsInOrder() {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => ({
      name,
      sql: readFileSync(join(migrationsDir, name), 'utf8').toLowerCase(),
    }))
}

describe('word_status migration security', () => {
  it('leaves word_status configured as a security-invoker view', () => {
    let lastViewChange: { name: string; secure: boolean } | null = null

    for (const migration of readMigrationsInOrder()) {
      const changesWordStatus =
        /\bcreate\s+(?:or\s+replace\s+)?view\s+public\.word_status\b/.test(migration.sql) ||
        /\balter\s+view\s+public\.word_status\b/.test(migration.sql)

      if (!changesWordStatus) continue

      lastViewChange = {
        name: migration.name,
        secure: /security_invoker\s*=\s*true/.test(migration.sql),
      }
    }

    expect(lastViewChange).not.toBeNull()
    expect(lastViewChange, `${lastViewChange?.name ?? 'no migration'} must set security_invoker = true`).toMatchObject({
      secure: true,
    })
  })
})
