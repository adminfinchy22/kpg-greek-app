import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { shuffleCopy } from '../lib/shuffle'
import { isCloseGreek, isCorrectGreek } from '../lib/greekMatch'
import { PERSON_LABEL_EL, PERSON_ORDER } from '../lib/verbLabels'
import { formForPersonTense } from '../lib/verbFormLookup'
import type { Verb, VerbPerson } from '../types'

interface Props {
  verbs: Verb[]
}

type Result = 'correct' | 'close' | 'wrong' | null

function pickPerson(): VerbPerson {
  return PERSON_ORDER[Math.floor(Math.random() * PERSON_ORDER.length)]
}

function formFor(verb: Verb, person: VerbPerson): string | null {
  const f = formForPersonTense(verb.verb_forms, person, 'present')
  return f === '—' ? null : f
}

export default function ConjugationDrill({ verbs }: Props) {
  const pool = useMemo(
    () =>
      verbs.filter((v) =>
        PERSON_ORDER.every((p) => {
          const f = formFor(v, p)
          return f != null && f.trim().length > 0
        }),
      ),
    [verbs],
  )

  const [shuffleKey, setShuffleKey] = useState(0)
  const deck = useMemo(() => {
    void shuffleKey
    return shuffleCopy(pool)
  }, [pool, shuffleKey])
  const [idx, setIdx] = useState(0)
  const [person, setPerson] = useState<VerbPerson>(() => pickPerson())
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Result>(null)
  const [strictMode, setStrictMode] = useState(false)
  const [byPerson, setByPerson] = useState<Record<VerbPerson, { ok: number; fail: number }>>(() =>
    Object.fromEntries(PERSON_ORDER.map((p) => [p, { ok: 0, fail: 0 }])) as Record<
      VerbPerson,
      { ok: number; fail: number }
    >,
  )
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset drill when verb pool changes
    setShuffleKey((k) => k + 1)
    setIdx(0)
    setPerson(pickPerson())
    setInput('')
    setResult(null)
    setByPerson(
      Object.fromEntries(PERSON_ORDER.map((p) => [p, { ok: 0, fail: 0 }])) as Record<
        VerbPerson,
        { ok: number; fail: number }
      >,
    )
  }, [pool])

  useEffect(() => {
    if (result === null) inputRef.current?.focus()
  }, [result, idx, person])

  const at = deck.length > 0 ? idx % deck.length : 0
  const card = deck[at] ?? null
  const target = card ? formFor(card, person) : null

  const check = useCallback(() => {
    if (!card || !target || result !== null) return
    const ok = isCorrectGreek(input, target, strictMode)
    const close = !ok && isCloseGreek(input, target)
    const r: Result = ok ? 'correct' : close ? 'close' : 'wrong'
    setResult(r)
    setByPerson((prev) => ({
      ...prev,
      [person]: {
        ok: prev[person].ok + (ok ? 1 : 0),
        fail: prev[person].fail + (ok ? 0 : 1),
      },
    }))
  }, [card, target, input, result, strictMode, person])

  const next = () => {
    setInput('')
    setResult(null)
    setPerson(pickPerson())
    setIdx((i) => (deck.length === 0 ? 0 : (i + 1) % deck.length))
  }

  if (pool.length === 0) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
        Нужны глаголы с полным набором из 6 лиц в базе.
      </div>
    )
  }

  if (!card || !target) return null

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
        padding: '24px 20px',
        marginBottom: '18px',
        textAlign: 'center',
      }}
      >
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px' }}>
          Спрягите глагол
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', fontWeight: 600, color: 'var(--amber-lt)' }}>
          {card.greek}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--cream-dim)', marginTop: '14px', lineHeight: 1.5 }}>
          {PERSON_LABEL_EL[person]}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '10px' }}>
          {card.russian}
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
        placeholder="Форма настоящего времени…"
        style={{
          width: '100%',
          padding: '13px 16px',
          background: result === null ? 'var(--card)' : result === 'correct' ? 'var(--green-bg)' : result === 'close' ? '#1a2a10' : 'var(--red-bg)',
          border: `1px solid ${result === null ? 'var(--border)' : resultColor}`,
          borderRadius: '8px',
          color: result === null ? 'var(--cream)' : resultColor,
          fontSize: '18px',
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
          <div style={{ fontSize: '15px', color: 'var(--amber-lt)', fontFamily: "'Playfair Display', serif", marginTop: '4px' }}>
            {target}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
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

      <div style={{
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        color: 'var(--muted)',
        marginBottom: '8px',
      }}>
        Слабые лица (ошибки / всего)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: '11px' }}>
        {PERSON_ORDER.map((p) => {
          const { ok, fail } = byPerson[p]
          const total = ok + fail
          const weak = total > 0 && fail / total >= 0.34
          return (
            <div
              key={p}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: `1px solid ${weak ? 'var(--amber)' : 'var(--border)'}`,
                background: weak ? '#2a2210' : 'var(--card)',
                color: 'var(--cream-dim)',
              }}
            >
              <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>{p}</div>
              <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fail} / {total}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '12px', textAlign: 'center' }}>
        Enter — проверить / следующее
        {!strictMode && ' · Ударения не обязательны'}
      </div>
    </div>
  )
}
