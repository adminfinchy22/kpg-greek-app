import { useCallback, useEffect, useRef, useState } from 'react'
import type { VocabEntry } from '../types'

interface Props {
  vocab: VocabEntry[]
}

type Result = 'correct' | 'close' | 'wrong' | null

// Strip Greek accent marks for loose comparison
function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

// Accept if exact match OR accent-stripped match
function isCorrect(input: string, target: string): boolean {
  const i = input.trim().toLowerCase()
  const t = target.trim().toLowerCase()
  return i === t || stripAccents(i) === stripAccents(t)
}

// "Close" = only one character off (useful feedback)
function isClose(input: string, target: string): boolean {
  const i = stripAccents(input.trim())
  const t = stripAccents(target.trim())
  if (Math.abs(i.length - t.length) > 2) return false
  let diff = 0
  const len = Math.max(i.length, t.length)
  for (let n = 0; n < len; n++) {
    if (i[n] !== t[n]) diff++
  }
  return diff <= 2
}

export default function TypingCard({ vocab }: Props) {
  const [deck, setDeck]       = useState<VocabEntry[]>([])
  const [idx, setIdx]         = useState(0)
  const [input, setInput]     = useState('')
  const [result, setResult]   = useState<Result>(null)
  const [score, setScore]     = useState({ correct: 0, total: 0 })
  const [strictMode, setStrictMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeck([...vocab].sort(() => Math.random() - 0.5))
    setIdx(0); setInput(''); setResult(null); setScore({ correct: 0, total: 0 })
  }, [vocab])

  useEffect(() => {
    if (result === null) inputRef.current?.focus()
  }, [result, idx])

  const card = deck[idx] ?? null

  const check = useCallback(() => {
    if (!card || result !== null) return
    const target = card.greek
    const ok = strictMode
      ? input.trim().toLowerCase() === target.trim().toLowerCase()
      : isCorrect(input, target)
    const close = !ok && isClose(input, target)
    const r: Result = ok ? 'correct' : close ? 'close' : 'wrong'
    setResult(r)
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
  }, [card, input, result, strictMode])

  const next = () => {
    setInput(''); setResult(null)
    setIdx((i) => (i + 1) % deck.length)
  }

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null

  if (!card) return (
    <div style={{ color: 'var(--muted)' }}>Нет слов в этой теме.</div>
  )

  const resultColor = result === 'correct' ? 'var(--green)' : result === 'close' ? 'var(--amber-lt)' : 'var(--red)'

  return (
    <div>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', color: 'var(--muted)' }}>
        <span>{idx + 1} / {deck.length}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={strictMode}
            onChange={(e) => setStrictMode(e.target.checked)}
            style={{ accentColor: 'var(--amber)' }}
          />
          Строгие ударения
        </label>
        {accuracy !== null && (
          <span style={{ color: accuracy >= 70 ? 'var(--green)' : 'var(--red)' }}>
            {score.correct}/{score.total} ({accuracy}%)
          </span>
        )}
      </div>

      {/* Prompt card */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '28px 24px', textAlign: 'center', marginBottom: '20px',
      }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '10px' }}>
          Напишите по-гречески
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 600, color: 'var(--cream)' }}>
          {card.russian}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
          {card.topic?.name_ru ?? ''}
        </div>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            if (result === null) check()
            else next()
          }
        }}
        disabled={result !== null}
        placeholder="Введите греческое слово..."
        style={{
          width: '100%', padding: '13px 16px',
          background: result === null ? 'var(--card)' : result === 'correct' ? 'var(--green-bg)' : result === 'close' ? '#1a2a10' : 'var(--red-bg)',
          border: `1px solid ${result === null ? 'var(--border)' : resultColor}`,
          borderRadius: '8px', color: result === null ? 'var(--cream)' : resultColor,
          fontSize: '18px', outline: 'none',
          fontFamily: "'Playfair Display', serif",
          transition: 'all 0.2s', marginBottom: '12px',
          textAlign: 'center',
        }}
      />

      {/* Feedback */}
      {result && (
        <div style={{ textAlign: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '15px', color: resultColor, fontWeight: 600, marginBottom: '4px' }}>
            {result === 'correct' && 'Правильно!'}
            {result === 'close'   && 'Почти! Проверьте ударения'}
            {result === 'wrong'   && 'Неверно'}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--amber-lt)', fontFamily: "'Playfair Display', serif" }}>
            {card.greek}
          </div>
        </div>
      )}

      {/* Action button */}
      <div style={{ display: 'flex', gap: '10px' }}>
        {result === null ? (
          <button onClick={check} style={{
            flex: 1, padding: '11px',
            background: 'var(--amber)', border: 'none',
            color: '#0d1b2a', fontWeight: 600,
            borderRadius: '6px', fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Проверить
          </button>
        ) : (
          <button onClick={next} style={{
            flex: 1, padding: '11px',
            background: 'var(--card)', border: '1px solid var(--border)',
            color: 'var(--cream)', fontWeight: 600,
            borderRadius: '6px', fontSize: '14px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Следующее →
          </button>
        )}
      </div>

      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', textAlign: 'center' }}>
        Enter — проверить / следующее
        {!strictMode && ' · Ударения не обязательны'}
      </div>
    </div>
  )
}
