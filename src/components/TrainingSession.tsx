import { useCallback, useEffect, useState } from 'react'
import { isCloseGreek, isCorrectGreek } from '../lib/greekMatch'
import { PERSON_LABEL_EL } from '../lib/verbLabels'
import { useWordExamples } from '../hooks/useWordExamples'
import { useTrainingSession } from '../hooks/useTrainingSession'
import type { VerbForm, VocabEntry, VerbPerson } from '../types'

interface Props {
  open: boolean
  words: VocabEntry[]
  distractorPool: VocabEntry[]
  /** Pre-fetched so the step queue includes conjugation before first paint. */
  verbFormMap: Map<number, VerbForm[]>
  onClose: () => void
  onComplete: (vocabIds: number[]) => void
}

export default function TrainingSession({
  open,
  words,
  distractorPool,
  verbFormMap,
  onClose,
  onComplete,
}: Props) {
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [typingInput, setTypingInput] = useState('')
  const [typingResult, setTypingResult] = useState<'correct' | 'close' | 'wrong' | null>(null)
  const [strictMode, setStrictMode] = useState(false)

  const { step, idx, progressLabel, reset, goNext, submitGraded, correct, graded } = useTrainingSession(
    words,
    distractorPool,
    verbFormMap,
  )

  useEffect(() => {
    if (open) {
      reset()
      setTypingInput('')
      setTypingResult(null)
      setConfirmEnd(false)
    }
  }, [open, reset, words])

  const handleClose = useCallback(() => {
    setConfirmEnd(false)
    onClose()
  }, [onClose])

  if (!open) return null

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{progressLabel}</span>
          <button type="button" onClick={() => setConfirmEnd(true)} style={ghostBtn}>
            ✕
          </button>
        </div>

        {confirmEnd && (
          <div style={{ marginBottom: '14px', padding: '12px', background: 'var(--card)', borderRadius: '8px', fontSize: '13px' }}>
            <p style={{ margin: '0 0 10px' }}>Завершить тренировку?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={() => setConfirmEnd(false)} style={ghostBtn}>
                Продолжить
              </button>
              <button type="button" onClick={handleClose} style={{ ...ghostBtn, color: 'var(--red)' }}>
                Выйти
              </button>
            </div>
          </div>
        )}

        {!step && <p style={{ color: 'var(--muted)' }}>Нет шагов.</p>}

        <div key={idx}>
          {step?.type === 'intro' && <IntroStep word={step.word} onContinue={goNext} />}

          {step?.type === 'mcq_recognition' && (
            <McqStep
              title="Выберите перевод"
              prompt={step.word.greek}
              sub={step.word.topic?.name_ru}
              options={step.opts}
              correct={step.word}
              optionLabel={(o) => o.russian}
              onAnswer={submitGraded}
            />
          )}

          {step?.type === 'mcq_production' && (
            <McqStep
              title="Как по-гречески?"
              prompt={step.word.russian}
              sub={step.word.topic?.name_ru}
              options={step.opts}
              correct={step.word}
              optionLabel={(o) => o.greek}
              onAnswer={submitGraded}
            />
          )}

          {step?.type === 'conjugation' && (
            <ConjugationMcq
              word={step.word}
              person={step.person}
              opts={step.opts}
              answer={step.answer}
              onAnswer={submitGraded}
            />
          )}

          {step?.type === 'typing' && (
            <TypingStep
              word={step.word}
              input={typingInput}
              setInput={setTypingInput}
              result={typingResult}
              setResult={setTypingResult}
              strictMode={strictMode}
              setStrictMode={setStrictMode}
              onAdvance={(ok) => {
                submitGraded(ok)
                setTypingInput('')
                setTypingResult(null)
              }}
            />
          )}

          {step?.type === 'results' && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: 'var(--amber-lt)', marginBottom: '8px' }}>
                Готово
              </p>
              <p style={{ color: 'var(--cream-dim)', marginBottom: '20px' }}>
                Верно: {correct} из {graded}
              </p>
              <button
                type="button"
                onClick={() => {
                  onComplete(words.map((w) => w.id))
                  handleClose()
                }}
                style={primaryBtn}
              >
                Продолжить
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 60,
  background: 'rgba(13, 27, 42, 0.88)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '16px',
}

const panelStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  maxHeight: '90vh',
  overflow: 'auto',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '20px',
  color: 'var(--cream)',
}

const ghostBtn: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--cream)',
  borderRadius: '8px',
  padding: '6px 12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '12px',
}

const primaryBtn: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  background: 'var(--amber)',
  border: 'none',
  borderRadius: '8px',
  color: '#0d1b2a',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  fontFamily: 'inherit',
}

function IntroStep({ word, onContinue }: { word: VocabEntry; onContinue: () => void }) {
  const { examples } = useWordExamples(word.id)
  const ex = examples[0]

  return (
    <div>
      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px' }}>
        Слово
      </p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', color: 'var(--amber-lt)', margin: '0 0 8px' }}>{word.greek}</p>
      <p style={{ fontSize: '16px', color: 'var(--cream-dim)', marginBottom: '16px' }}>{word.russian}</p>
      {word.pos === 'verb' && (
        <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '12px' }}>
          Настоящее · будущее · прошедшее — в карточке слова.
        </p>
      )}
      {ex && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '13px' }}>
          <div style={{ color: 'var(--cream)' }}>{ex.sentence_el}</div>
          <div style={{ color: 'var(--cream-dim)', marginTop: '6px' }}>{ex.sentence_ru}</div>
        </div>
      )}
      <button type="button" onClick={onContinue} style={primaryBtn}>
        Далее
      </button>
    </div>
  )
}

function McqStep({
  title,
  prompt,
  sub,
  options,
  correct,
  optionLabel,
  onAnswer,
}: {
  title: string
  prompt: string
  sub?: string | null
  options: VocabEntry[]
  correct: VocabEntry
  optionLabel: (o: VocabEntry) => string
  onAnswer: (ok: boolean) => void
}) {
  const [picked, setPicked] = useState<VocabEntry | null>(null)
  const ok = picked != null && picked.id === correct.id

  return (
    <div>
      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px' }}>{title}</p>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', marginBottom: '6px' }}>{prompt}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '14px' }}>{sub}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
        {options.map((o) => {
          let bg = 'var(--card)'
          let border = 'var(--border)'
          let color = 'var(--cream)'
          if (picked) {
            if (o.id === correct.id) {
              bg = 'var(--green-bg)'
              border = 'var(--green)'
              color = 'var(--green)'
            } else if (o.id === picked.id) {
              bg = 'var(--red-bg)'
              border = 'var(--red)'
              color = 'var(--red)'
            }
          }
          return (
            <button
              key={o.id}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(o)
                setTimeout(() => onAnswer(o.id === correct.id), 450)
              }}
              style={{
                padding: '12px',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: '8px',
                color,
                fontSize: '14px',
                cursor: picked ? 'default' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {optionLabel(o)}
            </button>
          )
        })}
      </div>
      {picked && <p style={{ fontSize: '12px', color: ok ? 'var(--green)' : 'var(--red)' }}>{ok ? 'Верно' : 'Неверно'}</p>}
    </div>
  )
}

function ConjugationMcq({
  word,
  person,
  opts,
  answer,
  onAnswer,
}: {
  word: VocabEntry
  person: VerbPerson
  opts: string[]
  answer: string
  onAnswer: (ok: boolean) => void
}) {
  const [picked, setPicked] = useState<string | null>(null)

  return (
    <div>
      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px' }}>
        Спряжение
      </p>
      <p style={{ fontSize: '14px', color: 'var(--cream-dim)', marginBottom: '6px' }}>{word.greek}</p>
      <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>{PERSON_LABEL_EL[person]}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {opts.map((opt, i) => {
          let bg = 'var(--card)'
          let border = 'var(--border)'
          if (picked) {
            if (opt === answer) {
              bg = 'var(--green-bg)'
              border = 'var(--green)'
            } else if (opt === picked) {
              bg = 'var(--red-bg)'
              border = 'var(--red)'
            }
          }
          return (
            <button
              key={`${opt}-${i}`}
              type="button"
              disabled={picked !== null}
              onClick={() => {
                setPicked(opt)
                setTimeout(() => onAnswer(opt === answer), 450)
              }}
              style={{
                padding: '12px',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: '8px',
                color: 'var(--cream)',
                fontFamily: 'Georgia, serif',
                fontSize: '15px',
                cursor: picked ? 'default' : 'pointer',
              }}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TypingStep({
  word,
  input,
  setInput,
  result,
  setResult,
  strictMode,
  setStrictMode,
  onAdvance,
}: {
  word: VocabEntry
  input: string
  setInput: (s: string) => void
  result: 'correct' | 'close' | 'wrong' | null
  setResult: (r: 'correct' | 'close' | 'wrong' | null) => void
  strictMode: boolean
  setStrictMode: (b: boolean) => void
  onAdvance: (ok: boolean) => void
}) {
  const check = () => {
    if (result !== null) return
    const target = word.greek
    const ok = isCorrectGreek(input, target, strictMode)
    const close = !ok && isCloseGreek(input, target)
    setResult(ok ? 'correct' : close ? 'close' : 'wrong')
  }

  const next = () => {
    const ok = result === 'correct'
    onAdvance(ok)
  }

  const col =
    result === 'correct' ? 'var(--green)' : result === 'close' ? 'var(--amber-lt)' : result === 'wrong' ? 'var(--red)' : 'var(--muted)'

  return (
    <div>
      <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px' }}>
        Набор
      </p>
      <p style={{ fontSize: '16px', marginBottom: '12px' }}>{word.russian}</p>
      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)', marginBottom: '8px' }}>
        <input type="checkbox" checked={strictMode} onChange={(e) => setStrictMode(e.target.checked)} />
        Строгие ударения
      </label>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && (result === null ? check() : next())}
        placeholder="Греческое слово…"
        disabled={result !== null}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
          color: 'var(--cream)',
          fontSize: '16px',
          fontFamily: 'Georgia, serif',
          marginBottom: '10px',
        }}
      />
      {result && (
        <p style={{ color: col, marginBottom: '10px' }}>{result === 'correct' ? 'Верно' : result === 'close' ? 'Почти' : 'Неверно'}</p>
      )}
      <button type="button" onClick={result === null ? check : next} style={primaryBtn}>
        {result === null ? 'Проверить' : 'Далее'}
      </button>
    </div>
  )
}
