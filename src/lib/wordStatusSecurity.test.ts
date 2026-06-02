import { describe, expect, it } from 'vitest'

const migrations = import.meta.glob('../../supabase/migrations/*.sql', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function migrationStatements(): string[] {
  return Object.entries(migrations)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([, sql]) =>
      sql
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
