import { useMemo } from 'react'
import { VERB_SEMANTIC_GROUPS } from '../types'
import type { VocabEntry } from '../types'

const ICONS: Record<string, string> = {
  movement: '🚶',
  cognition: '💭',
  daily_routine: '☀️',
  communication: '💬',
  household: '🏠',
}

interface Props {
  allVocab: VocabEntry[]
  known: Set<number>
  activeGroup: string | null
  onSelectGroup: (value: string | null) => void
}

export default function VerbCategoryPicker({ allVocab, known, activeGroup, onSelectGroup }: Props) {
  const verbs = useMemo(() => allVocab.filter((v) => v.pos === 'verb'), [allVocab])

  const total = verbs.length
  const knownIn = (g: string | null) => {
    const list = g == null ? verbs : verbs.filter((v) => v.semantic_group === g)
    return list.filter((v) => known.has(v.id)).length
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '12px' }}>
        Категории глаголов
      </p>
      <button
        type="button"
        onClick={() => onSelectGroup(null)}
        style={cardStyle(activeGroup === null)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '26px' }}>📚</span>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '14px' }}>Все глаголы</div>
            <div style={{ fontSize: '12px', color: 'var(--cream-dim)' }}>{total} · {knownIn(null)} выучено</div>
            <MiniBar n={knownIn(null)} d={total} />
          </div>
        </div>
      </button>

      {VERB_SEMANTIC_GROUPS.map(({ value, labelRu }) => {
        const list = verbs.filter((v) => v.semantic_group === value)
        const n = list.length
        const k = list.filter((v) => known.has(v.id)).length
        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelectGroup(value)}
            style={cardStyle(activeGroup === value)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '26px' }}>{ICONS[value] ?? '•'}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{labelRu}</div>
                <div style={{ fontSize: '12px', color: 'var(--cream-dim)' }}>{n} глаг. · {k} выучено</div>
                <MiniBar n={k} d={n} />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function cardStyle(active: boolean): React.CSSProperties {
  return {
    display: 'block',
    width: '100%',
    marginBottom: '10px',
    padding: '14px 16px',
    borderRadius: '12px',
    border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
    background: active ? 'var(--card)' : 'transparent',
    color: 'var(--cream)',
    cursor: 'pointer',
    fontFamily: 'inherit',
  }
}

function MiniBar({ n, d }: { n: number; d: number }) {
  const p = d > 0 ? Math.round((n / d) * 100) : 0
  return (
    <div style={{ height: '5px', background: 'var(--card-hover)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
      <div style={{ width: `${p}%`, height: '100%', background: 'var(--amber)', borderRadius: '3px' }} />
    </div>
  )
}
