import { useState, useMemo, useCallback } from 'react'
import { usePhrases } from './hooks/usePhrases'
import { useProgress } from './hooks/useProgress'
import { useTopics, useVocab } from './hooks/useVocab'
import {
  buildNormalizedTopicNameById,
  filterGroupedPhrasesByTopicSelection,
  phraseCountByTopicId,
  sumGroupedPhraseCounts,
} from './lib/phraseTopic'
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

  const { topics, loading: topicsLoading, error: topicsError, refetch: refetchTopics } =
    useTopics()
  const {
    vocab: allVocab,
    loading: allVocabLoading,
    error: allVocabError,
    refetch: refetchAllVocab,
  } = useVocab(null)
  const {
    vocab: filteredVocab,
    loading: filteredVocabLoading,
    error: filteredVocabError,
    refetch: refetchFilteredVocab,
  } = useVocab(selectedTopicId)
  const {
    grouped,
    loading: phrasesLoading,
    error: phrasesError,
    refetch: refetchPhrases,
  } = usePhrases()
  const {
    known,
    knownCount,
    toggleKnown,
    loading: progressLoading,
    error: progressError,
    refetch: refetchProgress,
  } = useProgress()

  const bootLoading =
    topicsLoading ||
    allVocabLoading ||
    filteredVocabLoading ||
    phrasesLoading ||
    progressLoading

  const loadError = useMemo(() => {
    const parts = [
      topicsError,
      allVocabError,
      filteredVocabError,
      phrasesError,
      progressError,
    ].filter((m): m is string => Boolean(m))
    return [...new Set(parts)].join(' · ') || null
  }, [
    topicsError,
    allVocabError,
    filteredVocabError,
    phrasesError,
    progressError,
  ])

  const retryLoad = useCallback(() => {
    refetchTopics()
    refetchAllVocab()
    refetchFilteredVocab()
    refetchPhrases()
    refetchProgress()
  }, [
    refetchTopics,
    refetchAllVocab,
    refetchFilteredVocab,
    refetchPhrases,
    refetchProgress,
  ])

  const knownCountInTopic = useMemo(() =>
    filteredVocab.filter((v) => known.has(v.id)).length,
    [filteredVocab, known]
  )
  const normalizedTopicNameById = useMemo(
    () => buildNormalizedTopicNameById(topics),
    [topics]
  )
  const filteredGroupedPhrases = useMemo(
    () => filterGroupedPhrasesByTopicSelection(grouped, selectedTopicId, normalizedTopicNameById),
    [grouped, selectedTopicId, normalizedTopicNameById]
  )
  const filteredPhrasesTotal = useMemo(
    () => sumGroupedPhraseCounts(filteredGroupedPhrases),
    [filteredGroupedPhrases]
  )
  const phraseCountByTopicIdMap = useMemo(
    () => phraseCountByTopicId(grouped, topics),
    [grouped, topics]
  )
  const phrasesTotal = useMemo(
    () => Object.values(phraseCountByTopicIdMap).reduce((acc, count) => acc + count, 0),
    [phraseCountByTopicIdMap]
  )

  const shellStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--cream)',
  }

  if (loadError) {
    return (
      <div style={shellStyle}>
        <div style={{ maxWidth: '440px', margin: '0 auto', padding: '20vh 24px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: 'var(--amber-lt)', marginBottom: '12px' }}>
            KPG A2 · Греческий
          </p>
          <p style={{ color: 'var(--red)', marginBottom: '10px', fontSize: '14px' }}>
            Не удалось загрузить данные
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '22px' }}>
            {loadError}
          </p>
          <button
            type="button"
            onClick={retryLoad}
            style={{
              padding: '10px 28px',
              background: 'var(--amber)',
              border: 'none',
              color: '#0d1b2a',
              fontWeight: 600,
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Повторить
          </button>
        </div>
      </div>
    )
  }

  if (bootLoading) {
    return (
      <div style={shellStyle}>
        <div style={{ textAlign: 'center', paddingTop: '22vh', color: 'var(--muted)', fontSize: '14px' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: 'var(--amber-lt)', marginBottom: '14px' }}>
            KPG A2 · Греческий
          </p>
          Загрузка…
        </div>
      </div>
    )
  }

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
          countByTopicId={mode === 'phrases' ? phraseCountByTopicIdMap : undefined}
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
