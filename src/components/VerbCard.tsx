import { useState, useMemo, useEffect } from 'react'
import { shuffleCopy } from '../lib/shuffle'
import { PERSON_ORDER, PERSON_LABEL_SHORT } from '../lib/verbLabels'
import { formForPersonTense } from '../lib/verbFormLookup'
import type { Verb, VerbForm, VerbPerson } from '../types'

interface Props {
  verbs: Verb[]
  known: Set<number>
  knownCountInTopic: number
  onToggleKnown: (id: number) => void
}

const btn: React.CSSProperties = {
  padding: '9px 18px',
  background: 'var(--card)',
  border: '1px solid var(--border)',
  color: 'var(--cream)',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  transition: 'background 0.15s',
}

function formForPerson(forms: VerbForm[], person: VerbPerson): string {
  return formForPersonTense(forms, person, 'present')
}

export default function VerbCard({ verbs, known, knownCountInTopic, onToggleKnown }: Props) {
  const deckSource = useMemo(
    () => verbs.filter((v) => (v.verb_forms?.length ?? 0) >= 1),
    [verbs],
  )
  const [shuffleKey, setShuffleKey] = useState(0)
  const [idx, setIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const deck = useMemo(() => {
    void shuffleKey
    return shuffleCopy(deckSource)
  }, [deckSource, shuffleKey])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset card when verb list changes
    setIdx(0)
    setFlipped(false)
  }, [deckSource])

  const at = deck.length > 0 ? idx % deck.length : 0
  const card = deck[at] ?? null

  const go = (dir: 1 | -1) => {
    setFlipped(false)
    setTimeout(() => {
      setIdx((i) => {
        const len = Math.max(deck.length, 1)
        return (i + dir + len) % len
      })
    }, 250)
  }

  const shuffle = () => {
    setShuffleKey((k) => k + 1)
    setIdx(0)
    setFlipped(false)
  }

  if (!card) {
    return (
      <div style={{ color: 'var(--muted)' }}>
        Нет глаголов с формами для карточек.
      </div>
    )
  }

  const isKnown = known.has(card.id)

  return (
    <div>
      <style>{`
        .verb-flip-card { perspective: 1100px; cursor: pointer; user-select: none; }
        .verb-flip-inner { position: relative; transform-style: preserve-3d; transition: transform .48s cubic-bezier(.4,.2,.2,1); min-height: 220px; }
        .verb-flip-inner.flipped { transform: rotateY(180deg); }
        .verb-flip-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; padding: 16px; }
        .verb-flip-back { transform: rotateY(180deg); justify-content: flex-start; overflow: auto; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', color: 'var(--muted)' }}>
        <span>{at + 1} / {deck.length}</span>
        <span style={{ color: 'var(--green)' }}>{knownCountInTopic} выучено в теме</span>
      </div>

      <div className="verb-flip-card" onClick={() => setFlipped((f) => !f)}>
        <div className={`verb-flip-inner${flipped ? ' flipped' : ''}`}>
          <div className="verb-flip-face" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '10px' }}>
              Глагол (1-е лицо)
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 600, textAlign: 'center', color: 'var(--amber-lt)' }}>
              {card.greek}
            </div>
            <div style={{ fontSize: '15px', color: 'var(--cream-dim)', marginTop: '12px', textAlign: 'center', lineHeight: 1.4 }}>
              {card.russian}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '16px', opacity: 0.55 }}>
              нажмите, чтобы перевернуть
            </div>
          </div>

          <div className="verb-flip-face verb-flip-back" style={{ background: '#1a3050', border: '1px solid #2d5070' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px', width: '100%' }}>
              Настоящее время
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
              color: 'var(--cream)',
            }}
            >
              <tbody>
                {PERSON_ORDER.map((p) => (
                  <tr key={p}>
                    <td style={{ padding: '3px 8px 3px 0', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {PERSON_LABEL_SHORT[p]}
                    </td>
                    <td style={{ padding: '3px 0', fontFamily: 'Georgia, serif' }}>
                      {formForPerson(card.verb_forms, p)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button
          type="button"
          style={btn}
          onClick={(e) => { e.stopPropagation(); go(-1) }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--card-hover)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)' }}
        >
          ← Назад
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleKnown(card.id) }}
          style={{
            ...btn,
            flex: 1,
            background: isKnown ? 'var(--green-bg)' : 'var(--card)',
            border: `1px solid ${isKnown ? 'var(--green)' : 'var(--border)'}`,
            color: isKnown ? 'var(--green)' : 'var(--cream-dim)',
          }}
        >
          {isKnown ? '✓ Знаю' : 'Отметить «Знаю»'}
        </button>
        <button
          type="button"
          style={btn}
          onClick={(e) => { e.stopPropagation(); go(1) }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--card-hover)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--card)' }}
        >
          Вперёд →
        </button>
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); shuffle() }}
        style={{
          ...btn,
          width: '100%',
          marginTop: '10px',
          fontSize: '12px',
          color: 'var(--muted)',
        }}
      >
        Перемешать колоду
      </button>
    </div>
  )
}
