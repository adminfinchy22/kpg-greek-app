import { useMemo } from 'react'
import type { Topic, VocabEntry } from '../types'

interface Props {
  topics: Topic[]
  allVocab: VocabEntry[]
  known: Set<number>
  knownCount: number
  progressRows?: number
}

const EXAM = new Date('2026-05-19T12:00:00')

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86400000)
}

export default function ProfileTab({ topics, allVocab, known, knownCount, progressRows = 0 }: Props) {
  const total = allVocab.length
  const pct = total > 0 ? Math.round((knownCount / total) * 100) : 0
  const d = daysUntil(EXAM)

  const byTopic = useMemo(() => {
    const m = new Map<number, { n: number; k: number }>()
    for (const t of topics) m.set(t.id, { n: 0, k: 0 })
    for (const v of allVocab) {
      const cur = m.get(v.topic_id) ?? { n: 0, k: 0 }
      cur.n += 1
      if (known.has(v.id)) cur.k += 1
      m.set(v.topic_id, cur)
    }
    return m
  }, [topics, allVocab, known])

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '8px 4px 96px' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: 'var(--amber-lt)', marginBottom: '18px' }}>
        Профиль
      </h1>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 8px', fontSize: '13px', color: 'var(--muted)' }}>До экзамена (19 мая 2026)</p>
        <p style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: 'var(--cream)' }}>
          {d > 0 ? `${d} дн.` : d === 0 ? 'Сегодня' : 'Экзамен прошёл'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <StatBox label="Выучено слов" value={`${knownCount} / ${total}`} sub={`${pct}%`} />
        <StatBox label="Записей прогресса" value={String(progressRows)} sub="user_progress" />
      </div>

      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '10px' }}>
        По темам
      </p>
      {topics.map((t) => {
        const { n, k } = byTopic.get(t.id) ?? { n: 0, k: 0 }
        const p = n > 0 ? Math.round((k / n) * 100) : 0
        return (
          <div key={t.id} style={{ marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'var(--cream-dim)' }}>{t.name_ru}</span>
              <span style={{ color: 'var(--muted)' }}>{p}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--card-hover)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${p}%`, height: '100%', background: 'var(--amber)', borderRadius: '3px' }} />
            </div>
          </div>
        )
      })}

      <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '20px', lineHeight: 1.5 }}>
        Серия дней и полный SRS — после экзамена. Сейчас: простой учёт «знаю» и повтор по due_at после тренировок.
      </p>
    </div>
  )
}

function StatBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' }}>
      <p style={{ margin: '0 0 6px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)' }}>{label}</p>
      <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--cream)' }}>{value}</p>
      <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted)' }}>{sub}</p>
    </div>
  )
}
