import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

function migrationStatements(): string[] {
  return readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .flatMap((file) =>
      readFileSync(join(migrationsDir, file), 'utf8')
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean),
    )
}

describe('word_status view security', () => {
  it('leaves word_status as a security_invoker view', () => {
    const viewMutations = migrationStatements().filter((statement) =>
      /(?:create\s+(?:or\s+replace\s+)?view|alter\s+view)\s+public\.word_status\b/i.test(statement),
    )

    expect(viewMutations.length).toBeGreaterThan(0)
    expect(viewMutations.at(-1)).toMatch(/security_invoker\s*=\s*true/i)
  })
})
