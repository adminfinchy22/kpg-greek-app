import { useState, useMemo, useCallback } from 'react'
import { shuffleCopy } from './lib/shuffle'
import { fetchVerbFormsMap } from './lib/fetchVerbFormsMap'
import { usePhrases } from './hooks/usePhrases'
import { useProgress } from './hooks/useProgress'
import { useTopics, useVocab } from './hooks/useVocab'
import { useVerbs } from './hooks/useVerbs'
import {
  buildNormalizedTopicNameById,
  filterGroupedPhrasesByTopicSelection,
  phraseCountByTopicId,
  sumGroupedPhraseCounts,
} from './lib/phraseTopic'
import CatalogHome from './components/CatalogHome'
import TopicDetail from './components/TopicDetail'
import ProfileTab from './components/ProfileTab'
import VerbCategoryPicker from './components/VerbCategoryPicker'
import VerbDetail from './components/VerbDetail'
import TrainingSession from './components/TrainingSession'
import ProgressBar from './components/ProgressBar'
import PhraseCard from './components/PhraseCard'
import VerbsPanel from './components/VerbsPanel'
import type { Verb, VocabEntry } from './types'

type BottomTab = 'catalog' | 'verbs' | 'phrases' | 'profile'

const BOTTOM: { key: BottomTab; label: string }[] = [
  { key: 'catalog', label: 'Каталог' },
  { key: 'verbs', label: 'Глаголы' },
  { key: 'phrases', label: 'Фразы' },
  { key: 'profile', label: 'Профиль' },
]

export default function App() {
  const [tab, setTab] = useState<BottomTab>('catalog')
  const [catalogTopicId, setCatalogTopicId] = useState<number | null>(null)
  const [phraseTopicId, setPhraseTopicId] = useState<number | null>(null)
  const [verbSemanticGroup, setVerbSemanticGroup] = useState<string | null>(null)
  const [verbDetail, setVerbDetail] = useState<Verb | null>(null)

  const [trainOpen, setTrainOpen] = useState(false)
  const [trainWords, setTrainWords] = useState<VocabEntry[]>([])
  const [trainPool, setTrainPool] = useState<VocabEntry[]>([])
  const [trainVerbMap, setTrainVerbMap] = useState<Map<number, import('./types').VerbForm[]>>(new Map())

  const { topics, loading: topicsLoading, error: topicsError, refetch: refetchTopics } = useTopics()
  const {
    vocab: allVocab,
    loading: allVocabLoading,
    error: allVocabError,
    refetch: refetchAllVocab,
  } = useVocab(null)
  const {
    vocab: catalogTopicVocab,
    loading: catalogTopicVocabLoading,
    error: catalogTopicVocabError,
    refetch: refetchCatalogTopicVocab,
  } = useVocab(catalogTopicId, { enabled: tab === 'catalog' && catalogTopicId !== null })
  const {
    grouped,
    loading: phrasesLoading,
    error: phrasesError,
    refetch: refetchPhrases,
  } = usePhrases()
  const {
    known,
    knownCount,
    progressRowCount,
    toggleKnown,
    recordTrainingReview,
    loading: progressLoading,
    error: progressError,
    refetch: refetchProgress,
  } = useProgress()

  const {
    verbs,
    loading: verbsLoading,
    error: verbsError,
    refetch: refetchVerbs,
  } = useVerbs({
    topicId: null,
    semanticGroup: verbSemanticGroup,
    enabled: tab === 'verbs',
  })

  const bootLoading =
    topicsLoading || allVocabLoading || phrasesLoading || progressLoading || (catalogTopicId !== null && catalogTopicVocabLoading)

  const loadError = useMemo(() => {
    const parts = [topicsError, allVocabError, phrasesError, progressError, catalogTopicVocabError].filter(
      (m): m is string => Boolean(m),
    )
    return [...new Set(parts)].join(' · ') || null
  }, [topicsError, allVocabError, phrasesError, progressError, catalogTopicVocabError])

  const retryLoad = useCallback(() => {
    refetchTopics()
    refetchAllVocab()
    refetchCatalogTopicVocab()
    refetchPhrases()
    refetchProgress()
    refetchVerbs()
  }, [refetchTopics, refetchAllVocab, refetchCatalogTopicVocab, refetchPhrases, refetchProgress, refetchVerbs])

  const normalizedTopicNameById = useMemo(() => buildNormalizedTopicNameById(topics), [topics])
  const filteredGroupedPhrases = useMemo(
    () => filterGroupedPhrasesByTopicSelection(grouped, phraseTopicId, normalizedTopicNameById),
    [grouped, phraseTopicId, normalizedTopicNameById],
  )
  const filteredPhrasesTotal = useMemo(
    () => sumGroupedPhraseCounts(filteredGroupedPhrases),
    [filteredGroupedPhrases],
  )
  const phraseCountByTopicIdMap = useMemo(() => phraseCountByTopicId(grouped, topics), [grouped, topics])
  const phrasesTotal = useMemo(
    () => Object.values(phraseCountByTopicIdMap).reduce((acc, count) => acc + count, 0),
    [phraseCountByTopicIdMap],
  )

  const flatPhrasesForVerbs = useMemo(() => Object.values(filteredGroupedPhrases).flat(), [filteredGroupedPhrases])

  const knownCountInTopic = useMemo(
    () => catalogTopicVocab.filter((v) => known.has(v.id)).length,
    [catalogTopicVocab, known],
  )

  const verbsKnownInTopic = useMemo(() => verbs.filter((v) => known.has(v.id)).length, [verbs, known])

  const currentCatalogTopic = useMemo(
    () => (catalogTopicId == null ? null : topics.find((t) => t.id === catalogTopicId) ?? null),
    [catalogTopicId, topics],
  )

  const launchTraining = useCallback(async (words: VocabEntry[], pool: VocabEntry[]) => {
    const slice = words.slice(0, 3)
    if (!slice.length) return
    const m = await fetchVerbFormsMap(slice.filter((w) => w.pos === 'verb').map((w) => w.id))
    setTrainVerbMap(m)
    setTrainWords(slice)
    setTrainPool(pool.length ? pool : allVocab)
    setTrainOpen(true)
  }, [allVocab])

  const onTrainingDone = useCallback(
    async (ids: number[]) => {
      try {
        await recordTrainingReview(ids)
      } catch {
        /* non-fatal */
      }
      refetchProgress()
    },
    [recordTrainingReview, refetchProgress],
  )

  const shellStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--bg)',
    color: 'var(--cream)',
    paddingBottom: '72px',
  }

  if (loadError) {
    return (
      <div style={shellStyle}>
        <div style={{ maxWidth: '440px', margin: '0 auto', padding: '20vh 24px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: 'var(--amber-lt)', marginBottom: '12px' }}>
            KPG A2 · Греческий
          </p>
          <p style={{ color: 'var(--red)', marginBottom: '10px', fontSize: '14px' }}>Не удалось загрузить данные</p>
          <p style={{ color: 'var(--muted)', fontSize: '13px', lineHeight: 1.5, marginBottom: '22px' }}>{loadError}</p>
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
    <div style={shellStyle}>
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '16px 20px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--amber-lt)',
              letterSpacing: '.02em',
            }}
          >
            KPG A2 · Греческий
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Экзамен: 19 мая 2026, Никосия</span>
        </div>
        <ProgressBar known={knownCount} total={allVocab.length} />
      </header>

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '12px 16px 8px' }}>
        {tab === 'catalog' &&
          (catalogTopicId === null || !currentCatalogTopic ? (
            <CatalogHome
              topics={topics}
              allVocab={allVocab}
              onOpenTopic={(id) => setCatalogTopicId(id)}
              onLearnDue={(words) => launchTraining(words, allVocab)}
            />
          ) : (
            <TopicDetail
              topic={currentCatalogTopic}
              vocab={catalogTopicVocab}
              known={known}
              knownCountInTopic={knownCountInTopic}
              onToggleKnown={toggleKnown}
              onBack={() => setCatalogTopicId(null)}
              onRequestTraining={(words, pool) => {
                void launchTraining(words, pool)
              }}
            />
          ))}

        {tab === 'verbs' && (
          <div>
            <VerbCategoryPicker
              allVocab={allVocab}
              known={known}
              activeGroup={verbSemanticGroup}
              onSelectGroup={setVerbSemanticGroup}
            />
            {verbsLoading ? (
              <div style={{ color: 'var(--muted)' }}>Загрузка глаголов…</div>
            ) : verbsError ? (
              <div style={{ color: 'var(--red)' }}>
                {verbsError}
                <button type="button" onClick={() => refetchVerbs()} style={{ display: 'block', marginTop: '10px', ...ghostBtn }}>
                  Повторить
                </button>
              </div>
            ) : (
              <VerbsPanel
                verbs={verbs}
                phrases={flatPhrasesForVerbs}
                known={known}
                knownCountInTopic={verbsKnownInTopic}
                onToggleKnown={toggleKnown}
                onOpenVerb={(v) => setVerbDetail(v)}
              />
            )}
          </div>
        )}

        {tab === 'phrases' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: '8px' }}>
              Тема
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setPhraseTopicId(null)}
                style={chip(phraseTopicId === null)}
              >
                Все ({phrasesTotal})
              </button>
              {topics.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPhraseTopicId(t.id)}
                  style={chip(phraseTopicId === t.id)}
                >
                  {t.name_ru} ({phraseCountByTopicIdMap[t.id] ?? 0})
                </button>
              ))}
            </div>
            <PhraseCard grouped={filteredGroupedPhrases} total={filteredPhrasesTotal} />
          </div>
        )}

        {tab === 'profile' && (
          <ProfileTab
            topics={topics}
            allVocab={allVocab}
            known={known}
            knownCount={knownCount}
            progressRows={progressRowCount}
          />
        )}
      </main>

      <nav
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 40,
          display: 'flex',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {BOTTOM.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key)
              if (key !== 'catalog') setCatalogTopicId(null)
            }}
            style={{
              flex: 1,
              padding: '12px 4px',
              border: 'none',
              background: tab === key ? 'var(--card)' : 'transparent',
              color: tab === key ? 'var(--amber-lt)' : 'var(--cream-dim)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {verbDetail && (
        <VerbDetail
          verb={verbDetail}
          onClose={() => setVerbDetail(null)}
          onTrain={(v) => {
            setVerbDetail(null)
            const others = shuffleCopy(allVocab.filter((x) => x.id !== v.id && x.pos === 'verb')).slice(0, 2)
            const pick = [v as VocabEntry, ...others]
            void launchTraining(pick, allVocab.filter((x) => x.pos === 'verb'))
          }}
        />
      )}

      <TrainingSession
        open={trainOpen}
        words={trainWords}
        distractorPool={trainPool}
        verbFormMap={trainVerbMap}
        onClose={() => setTrainOpen(false)}
        onComplete={(ids) => {
          void onTrainingDone(ids)
          setTrainOpen(false)
        }}
      />
    </div>
  )
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 16px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  color: 'var(--cream)',
  borderRadius: '6px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '13px',
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: '6px',
    border: `1px solid ${active ? 'var(--amber)' : 'var(--border)'}`,
    background: active ? 'var(--card)' : 'transparent',
    color: active ? 'var(--amber-lt)' : 'var(--cream-dim)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '11px',
  }
}
