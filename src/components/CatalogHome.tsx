import { useMemo, useState } from 'react'
import { TOPIC_CATALOG_DEFAULTS } from '../lib/topicCatalogMeta'
import type { Topic, VocabEntry } from '../types'
import { aggregateStatusByTopic, useWordStatus } from '../hooks/useWordStatus'

interface Props {
  topics: Topic[]
  allVocab: VocabEntry[]
  onOpenTopic: (topicId: number) => void
  onLearnDue: (words: VocabEntry[]) => void
}

const SECTION_MAIN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const
const SECTION_VERBS = 15
const SECTION_NUM = 14

function countWordsInTopic(allVocab: VocabEntry[], topicId: number): number {
  return allVocab.filter((v) => v.topic_id === topicId).length
}

export default function CatalogHome({ topics, allVocab, onOpenTopic, onLearnDue }: Props) {
  const [q, setQ] = useState('')
  const { rows: statusRows, dueList, loading, error } = useWordStatus(null)
  const byTopic = useMemo(() => aggregateStatusByTopic(statusRows), [statusRows])

  const dueWords = useMemo(() => {
    const ids = new Set(dueList.map((r) => r.vocab_id))
    return allVocab.filter((v) => ids.has(v.id))
  }, [dueList, allVocab])

  const filteredTopics = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return null
    return topics.filter((x) => x.name_ru.toLowerCase().includes(t))
  }, [topics, q])

  const topicById = useMemo(() => new Map(topics.map((x) => [x.id, x])), [topics])

  const renderCard = (topicId: number) => {
    const topic = topicById.get(topicId)
    if (!topic) return null
    const total = countWordsInTopic(allVocab, topicId)
    const buckets = byTopic[topicId]
    const learned = buckets?.learned ?? 0
    const pct = total > 0 ? Math.round((learned / total) * 100) : 0
    const fb = TOPIC_CATALOG_DEFAULTS[topicId]
    const icon = topic.icon ?? fb?.icon ?? '📖'
    const color = topic.color ?? fb?.color ?? '#E6F1FB'

    return (
      <button
        key={topicId}
        type="button"
        onClick={() => onOpenTopic(topicId)}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '16px 18px',
          marginBottom: '12px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          background: color,
          color: '#0d1b2a',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '15px', marginBottom: '4px' }}>{topic.name_ru}</div>
            <div style={{ fontSize: '12px', opacity: 0.75 }}>{total} слов · {pct}% выучено</div>
            <div style={{ height: '6px', background: 'rgba(13,27,42,0.12)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: '#0d1b2a', borderRadius: '3px' }} />
            </div>
          </div>
          {pct >= 100 && total > 0 && <span style={{ fontSize: '20px' }}>✓</span>}
        </div>
      </button>
    )
  }

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '8px 4px 88px' }}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск темы…"
        style={{
          width: '100%',
          padding: '12px 14px',
          marginBottom: '16px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
          background: 'var(--card)',
          color: 'var(--cream)',
          fontSize: '15px',
          fontFamily: 'inherit',
        }}
      />

      {error && (
        <p style={{ color: 'var(--red)', fontSize: '13px', marginBottom: '12px' }}>
          Статусы слов: {error} (примените миграции Sprint 7A)
        </p>
      )}

      {dueWords.length > 0 && (
        <button
          type="button"
          onClick={() => onLearnDue(dueWords.slice(0, 3))}
          style={{
            width: '100%',
            padding: '14px',
            marginBottom: '20px',
            borderRadius: '10px',
            border: '1px solid var(--amber)',
            background: 'var(--card)',
            color: 'var(--amber-lt)',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Учить сейчас ({dueWords.length} к повторению)
        </button>
      )}

      {filteredTopics ? (
        <>
          <h2 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted)', margin: '0 0 10px' }}>
            Результаты поиска
          </h2>
          {filteredTopics.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Ничего не найдено.</p>
          ) : (
            filteredTopics.map((t) => renderCard(t.id))
          )}
        </>
      ) : (
        <>
          <h2 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted)', margin: '0 0 10px' }}>
            Основные темы KPG A2
          </h2>
          {SECTION_MAIN.map((id) => renderCard(id))}

          <h2 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted)', margin: '20px 0 10px' }}>
            Глаголы
          </h2>
          {renderCard(SECTION_VERBS)}

          <h2 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.12em', color: 'var(--muted)', margin: '20px 0 10px' }}>
            Числа
          </h2>
          {renderCard(SECTION_NUM)}
        </>
      )}

      {loading && <p style={{ color: 'var(--muted)', fontSize: '12px' }}>Обновление статусов…</p>}
    </div>
  )
}
