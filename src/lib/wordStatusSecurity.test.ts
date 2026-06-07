import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

describe('word_status migration security', () => {
  it('leaves public.word_status as a security_invoker view', () => {
    const wordStatusStatements = readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .sort()
      .flatMap((name) => {
        const sql = readFileSync(join(migrationsDir, name), 'utf8')
        return [...sql.matchAll(/(?:CREATE\s+OR\s+REPLACE\s+VIEW|ALTER\s+VIEW)\s+public\.word_status[\s\S]*?;/gi)].map(
          ([statement]) => ({ name, statement }),
        )
      })

    expect(wordStatusStatements.length).toBeGreaterThan(0)
    expect(wordStatusStatements.at(-1)).toMatchObject({
      name: '20260607110500_word_status_security_invoker.sql',
    })
    expect(wordStatusStatements.at(-1)?.statement).toMatch(/security_invoker\s*=\s*true/i)
  })
})
