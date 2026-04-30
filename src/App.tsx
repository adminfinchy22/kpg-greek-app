import { useState, useMemo } from 'react'
import { useTopics, useVocab } from './hooks/useVocab'
import { usePhrases } from './hooks/usePhrases'
import { useProgress } from './hooks/useProgress'
import Sidebar from './components/Sidebar'
import ProgressBar from './components/ProgressBar'
import Flashcard from './components/Flashcard'
import PhraseCard from './components/PhraseCard'
import TestMode from './components/TestMode'
import TypingCard from './components/TypingCard'

type Mode = 'flashcard' | 'phrases' | 'test' | 'typing'

const MODES: { key: Mode; label: string }[] = [
  { key: 'flashcard', label: 'Карточки' },
  { key: 'typing',    label: 'Набор'    },
  { key: 'phrases',   label: 'Фразы'    },
  { key: 'test',      label: 'Тест'     },
]

export default function App() {
  const [mode, setMode]               = useState<Mode>('flashcard')
  const [selectedTopicId, setTopic]   = useState<number | null>(null)

  const { topics }                    = useTopics()
  const { vocab: allVocab }           = useVocab(null)
  const { vocab: filteredVocab }      = useVocab(selectedTopicId)
  const { grouped } = usePhrases()
  const { known, knownCount, toggleKnown } = useProgress()

  const knownCountInTopic = useMemo(() =>
    filteredVocab.filter((v) => known.has(v.id)).length,
    [filteredVocab, known]
  )
  const normalizedTopicNameById = useMemo(() => {
    const map = new Map<number, string>()
    topics.forEach((topic) => {
      map.set(topic.id, topic.name_ru.trim().toLowerCase())
    })
    return map
  }, [topics])
  const filteredGroupedPhrases = useMemo(() => {
    if (selectedTopicId === null) return grouped
    const selectedName = normalizedTopicNameById.get(selectedTopicId)
    if (!selectedName) return {}

    return Object.fromEntries(
      Object.entries(grouped).filter(([topicName]) =>
        topicName.trim().toLowerCase() === selectedName
      )
    )
  }, [grouped, selectedTopicId, normalizedTopicNameById])
  const filteredPhrasesTotal = useMemo(
    () => Object.values(filteredGroupedPhrases).reduce((acc, items) => acc + items.length, 0),
    [filteredGroupedPhrases]
  )
  const phraseCountByTopicId = useMemo(() => {
    const byTopicName = new Map<string, number>()
    Object.entries(grouped).forEach(([topicName, items]) => {
      byTopicName.set(topicName.trim().toLowerCase(), items.length)
    })

    const result: Record<number, number> = {}
    topics.forEach((topic) => {
      const normalizedName = topic.name_ru.trim().toLowerCase()
      result[topic.id] = byTopicName.get(normalizedName) ?? 0
    })
    return result
  }, [grouped, topics])
  const phrasesTotal = useMemo(
    () => Object.values(phraseCountByTopicId).reduce((acc, count) => acc + count, 0),
    [phraseCountByTopicId]
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--cream)' }}>

      {/* ── HEADER ── */}
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '4px' }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px', fontWeight: 700,
            color: 'var(--amber-lt)', letterSpacing: '.02em',
          }}>
            KPG A2 · Греческий
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Экзамен: 19 мая 2026, Никосия
          </span>
        </div>

        <ProgressBar known={knownCount} total={allVocab.length} />

        {/* Mode tabs */}
        <div style={{ display: 'flex' }}>
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              style={{
                padding: '9px 22px',
                background: 'transparent',
                border: 'none',
                borderBottom: mode === key
                  ? '2px solid var(--amber)'
                  : '2px solid transparent',
                color: mode === key ? 'var(--amber-lt)' : 'var(--cream-dim)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{
        display: 'flex',
        maxWidth: '900px',
        margin: '0 auto',
        padding: '20px',
      }}>
        <Sidebar
          topics={topics}
          allVocab={allVocab}
          selectedTopicId={selectedTopicId}
          onSelect={setTopic}
          totalCount={mode === 'phrases' ? phrasesTotal : allVocab.length}
          countByTopicId={mode === 'phrases' ? phraseCountByTopicId : undefined}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {mode === 'flashcard' && (
            <Flashcard
              vocab={filteredVocab}
              known={known}
              knownCountInTopic={knownCountInTopic}
              onToggleKnown={toggleKnown}
            />
          )}
          {mode === 'typing' && (
            <TypingCard vocab={filteredVocab} />
          )}
          {mode === 'phrases' && (
            <PhraseCard grouped={filteredGroupedPhrases} total={filteredPhrasesTotal} />
          )}
          {mode === 'test' && (
            <TestMode vocab={filteredVocab} />
          )}
        </div>
      </div>
    </div>
  )
}
