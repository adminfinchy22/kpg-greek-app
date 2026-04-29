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
  const { grouped, total: phrasesTotal } = usePhrases()
  const { known, knownCount, toggleKnown } = useProgress()

  const knownCountInTopic = useMemo(() =>
    filteredVocab.filter((v) => known.has(v.id)).length,
    [filteredVocab, known]
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
            <PhraseCard grouped={grouped} total={phrasesTotal} />
          )}
          {mode === 'test' && (
            <TestMode vocab={filteredVocab} />
          )}
        </div>
      </div>
    </div>
  )
}
