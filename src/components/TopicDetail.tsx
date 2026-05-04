import { useCallback, useMemo, useState } from 'react'
import { shuffleCopy } from '../lib/shuffle'
import { useWordStatus } from '../hooks/useWordStatus'
import type { Topic, VocabEntry } from '../types'
import Flashcard from './Flashcard'
import TestMode from './TestMode'
import TypingCard from './TypingCard'
import WordDetail from './WordDetail'

type StudyMode = 'flashcard' | 'typing' | 'test'

interface Props {
  topic: Topic
  vocab: VocabEntry[]
  known: Set<number>
  knownCountInTopic: number
  onToggleKnown: (id: number) => void
  onBack: () => void
  onRequestTraining: (words: VocabEntry[], pool: VocabEntry[]) => void
}

function statusColor(status: string | undefined): string {
  if (status === 'learned') return 'var(--green)'
  if (status === 'due') return 'var(--red)'
  if (status === 'studying') return 'var(--amber-lt)'
  return 'var(--muted)'
}

export default function TopicDetail({
  topic,
  vocab,
  known,
  knownCountInTopic,
  onToggleKnown,
  onBack,
  onRequestTraining,
}: Props) {
  const [mode, setMode] = useState<StudyMode>('flashcard')
  const [detailWord, setDetailWord] = useState<VocabEntry | null>(null)

  const { rows: statusRows, dueList } = useWordStatus(topic.id)
  const statusById = useMemo(() => {
    const m = new Map<number, string>()
    for (const r of statusRows) m.set(r.vocab_id, r.status)
    return m
  }, [statusRows])

  const dueInTopic = useMemo(() => {
    const ids = new Set(dueList.map((r) => r.vocab_id))
    return vocab.filter((v) => ids.has(v.id))
  }, [dueList, vocab])

  const startSession = useCallback(
    (words: VocabEntry[]) => {
      const slice = words.slice(0, 3)
      if (slice.length === 0) return
      onRequestTraining(slice, vocab)
    },
    [onRequestTraining, vocab],
  )

  const defaultPick = useCallback(() => {
    const pool = dueInTopic.length >= 3 ? dueInTopic : shuffleCopy(vocab)
    return pool.slice(0, 3)
  }, [dueInTopic, vocab])

  const pills: { key: StudyMode; label: string }[] = [
    { key: 'flashcard', label: 'Карточки' },
    { key: 'typing', label: 'Набор' },
    { key: 'test', label: 'Тест' },
  ]

  return (
    <div style={{ padding: '8px 4px 96px', maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button type="button" onClick={onBack} style={backBtn}>
          ←
        </button>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', margin: 0, color: 'var(--amber-lt)' }}>
            {topic.name_ru}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>{vocab.length} слов</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
        {pills.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            style={{
              padding: '7px 14px',
              background: mode === key ? 'var(--card)' : 'transparent',
              border: `1px solid ${mode === key ? 'var(--amber)' : 'var(--border)'}`,
              color: mode === key ? 'var(--amber-lt)' : 'var(--cream-dim)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'flashcard' && (
        <Flashcard vocab={vocab} known={known} knownCountInTopic={knownCountInTopic} onToggleKnown={onToggleKnown} />
      )}
      {mode === 'typing' && <TypingCard vocab={vocab} />}
      {mode === 'test' && <TestMode vocab={vocab} />}

      <div style={{ marginTop: '22px', marginBottom: '12px' }}>
        <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: '8px' }}>
          Слова
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {vocab.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setDetailWord(w)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                textAlign: 'left',
                width: '100%',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--card)',
                color: 'var(--cream)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: statusColor(statusById.get(w.id)),
                  flexShrink: 0,
                }}
              />
              <span style={{ fontFamily: 'Georgia, serif', fontSize: '15px' }}>{w.greek}</span>
              <span style={{ color: 'var(--cream-dim)', fontSize: '13px', flex: 1 }}>{w.russian}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ position: 'sticky', bottom: '72px', marginTop: '12px' }}>
        <button type="button" onClick={() => startSession(defaultPick())} style={stickyTrainBtn}>
          Начать сессию ({Math.min(3, vocab.length)} слов)
        </button>
      </div>

      {detailWord && (
        <WordDetail
          word={detailWord}
          onClose={() => setDetailWord(null)}
          onStartTrain={(w) => {
            setDetailWord(null)
            const rest = shuffleCopy(vocab.filter((x) => x.id !== w.id))
            startSession([w, ...rest.slice(0, 2)])
          }}
        />
      )}
    </div>
  )
}

const backBtn: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--cream)',
  borderRadius: '8px',
  padding: '8px 12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '16px',
}

const stickyTrainBtn: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  borderRadius: '10px',
  border: '1px solid var(--amber)',
  background: 'var(--surface)',
  color: 'var(--amber-lt)',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}
