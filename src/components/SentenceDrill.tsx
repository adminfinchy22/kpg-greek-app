import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { shuffleCopy } from '../lib/shuffle'
import { isCloseGreek, isCorrectGreek } from '../lib/greekMatch'
import { buildSentenceDrillItems } from '../lib/sentenceVerbDrill'
import type { Phrase, Verb } from '../types'

interface Props {
  phrases: Phrase[]
  verbs: Verb[]
}

type Result = 'correct' | 'close' | 'wrong' | null

export default function SentenceDrill({ phrases, verbs }: Props) {
  const items = useMemo(() => buildSentenceDrillItems(phrases, verbs), [phrases, verbs])
  const [shuffleKey, setShuffleKey] = useState(0)
  const deck = useMemo(() => {
    void shuffleKey
    return shuffleCopy(items)
  }, [items, shuffleKey])
  const [idx, setIdx] = useState(0)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Result>(null)
  const [strictMode, setStrictMode] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when phrase/verb set changes
    setShuffleKey((k) => k + 1)
    setIdx(0)
    setInput('')
    setResult(null)
  }, [items])

  useEffect(() => {
    if (result === null) inputRef.current?.focus()
  }, [result, idx])

  const at = deck.length > 0 ? idx % deck.length : 0
  const card = deck[at] ?? null

  const check = useCallback(() => {
    if (!card || result !== null) return
    const ok = isCorrectGreek(input, card.answer, strictMode)
    const close = !ok && isCloseGreek(input, card.answer)
    setResult(ok ? 'correct' : close ? 'close' : 'wrong')
  }, [card, input, result, strictMode])

  const next = () => {
    setInput('')
    setResult(null)
    setIdx((i) => (deck.length === 0 ? 0 : (i + 1) % deck.length))
  }

  if (items.length === 0) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5 }}>
        Нет фраз, где встречается известный глагол (в шаблоне). Попробуйте другую тему или «Все группы».
      </div>
    )
  }

  if (!card) return null

  const resultColor = result === 'correct' ? 'var(--green)' : result === 'close' ? 'var(--amber-lt)' : 'var(--red)'

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', fontSize: '12px', color: 'var(--muted)' }}>
        <span>{at + 1} / {deck.length}</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={strictMode}
            onChange={(e) => setStrictMode(e.target.checked)}
            style={{ accentColor: 'var(--amber)' }}
          />
          Строгие ударения
        </label>
      </div>

      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '22px 18px',
        marginBottom: '18px',
      }}
      >
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '10px' }}>
          Вставьте глагол в нужной форме
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontSize: '17px', lineHeight: 1.55, color: 'var(--cream)' }}>
          {card.patternMasked}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '12px', fontStyle: 'italic' }}>
          {card.translation}
        </div>
      </div>

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
        placeholder="Греческая форма глагола…"
        style={{
          width: '100%',
          padding: '13px 16px',
          background: result === null ? 'var(--card)' : result === 'correct' ? 'var(--green-bg)' : result === 'close' ? '#1a2a10' : 'var(--red-bg)',
          border: `1px solid ${result === null ? 'var(--border)' : resultColor}`,
          borderRadius: '8px',
          color: result === null ? 'var(--cream)' : resultColor,
          fontSize: '17px',
          outline: 'none',
          fontFamily: "'Playfair Display', serif",
          textAlign: 'center',
          marginBottom: '12px',
        }}
      />

      {result && (
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div style={{ fontSize: '15px', color: resultColor, fontWeight: 600 }}>
            {result === 'correct' && 'Правильно!'}
            {result === 'close' && 'Почти! Проверьте ударения'}
            {result === 'wrong' && 'Неверно'}
          </div>
          <div style={{ fontSize: '16px', color: 'var(--amber-lt)', fontFamily: "'Playfair Display', serif", marginTop: '4px' }}>
            {card.answer}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        {result === null ? (
          <button
            type="button"
            onClick={check}
            style={{
              flex: 1,
              padding: '11px',
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
            Проверить
          </button>
        ) : (
          <button
            type="button"
            onClick={next}
            style={{
              flex: 1,
              padding: '11px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--cream)',
              fontWeight: 600,
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Следующее →
          </button>
        )}
      </div>

      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px', textAlign: 'center' }}>
        Enter — проверить / следующее
      </div>
    </div>
  )
}
