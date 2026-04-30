import { useState, useEffect } from 'react'
import type { VocabEntry } from '../types'

interface Props {
  vocab: VocabEntry[]
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

export default function Flashcard({ vocab, known, knownCountInTopic, onToggleKnown }: Props) {
  const [deck, setDeck]     = useState<VocabEntry[]>([])
  const [idx, setIdx]       = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeck([...vocab].sort(() => Math.random() - 0.5))
    setIdx(0)
    setFlipped(false)
  }, [vocab])

  const card = deck[idx] ?? null

  const go = (dir: 1 | -1) => {
    setFlipped(false)
    setTimeout(() => setIdx((i) => (i + dir + deck.length) % deck.length), 250)
  }

  const shuffle = () => {
    setDeck([...vocab].sort(() => Math.random() - 0.5))
    setIdx(0)
    setFlipped(false)
  }

  if (!card) return (
    <div style={{ color: 'var(--muted)' }}>Нет слов в этой теме.</div>
  )

  const isKnown = known.has(card.id)

  return (
    <div>
      <style>{`
        .flip-card { perspective: 1100px; cursor: pointer; user-select: none; }
        .flip-inner { position: relative; transform-style: preserve-3d; transition: transform .48s cubic-bezier(.4,.2,.2,1); height: 210px; }
        .flip-inner.flipped { transform: rotateY(180deg); }
        .flip-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; }
        .flip-back { transform: rotateY(180deg); }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '12px', color: 'var(--muted)' }}>
        <span>{idx + 1} / {deck.length}</span>
        <span style={{ color: 'var(--green)' }}>{knownCountInTopic} выучено в теме</span>
      </div>

      <div className="flip-card" onClick={() => setFlipped((f) => !f)}>
        <div className={`flip-inner${flipped ? ' flipped' : ''}`}>
          {/* Front — Greek */}
          <div className="flip-face" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '10px' }}>Греческий</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '30px', fontWeight: 600, textAlign: 'center', padding: '0 24px', lineHeight: 1.3, color: 'var(--cream)' }}>
              {card.greek}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '14px' }}>
              {card.topic?.name_ru ?? ''}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '20px', opacity: 0.5 }}>нажмите, чтобы перевернуть</div>
          </div>
          {/* Back — Russian */}
          <div className="flip-face flip-back" style={{ background: '#1a3050', border: '1px solid #2d5070' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '10px' }}>Русский</div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 600, textAlign: 'center', padding: '0 24px', lineHeight: 1.4, color: 'var(--amber-lt)' }}>
              {card.russian}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '14px' }}>
              {card.topic?.name_ru ?? ''}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button style={btn} onClick={() => go(-1)}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}>
          ← Назад
        </button>
        <button
          onClick={() => onToggleKnown(card.id)}
          style={{
            ...btn, flex: 1,
            background: isKnown ? 'var(--green-bg)' : 'var(--card)',
            border: `1px solid ${isKnown ? 'var(--green)' : 'var(--border)'}`,
            color: isKnown ? 'var(--green)' : 'var(--cream-dim)',
          }}>
          {isKnown ? '✓ Знаю' : 'Отметить «Знаю»'}
        </button>
        <button style={btn} onClick={() => go(1)}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--card)')}>
          Вперёд →
        </button>
      </div>

      <button onClick={shuffle} style={{
        ...btn, width: '100%', marginTop: '10px',
        fontSize: '12px', color: 'var(--muted)',
      }}>
        Перемешать колоду
      </button>
    </div>
  )
}
