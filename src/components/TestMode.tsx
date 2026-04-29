import { useCallback, useEffect, useState } from 'react'
import type { VocabEntry, TestQuestion } from '../types'

interface Props {
  vocab: VocabEntry[]
}

export default function TestMode({ vocab }: Props) {
  const [question, setQuestion] = useState<TestQuestion | null>(null)
  const [answered, setAnswered] = useState<{ selId: number; ok: boolean } | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const genQuestion = useCallback(() => {
    if (vocab.length < 4) return
    const shuffled = [...vocab].sort(() => Math.random() - 0.5)
    const correct = shuffled[0]
    const opts = [...shuffled.slice(1, 4), correct].sort(() => Math.random() - 0.5)
    setQuestion({ correct, opts })
    setAnswered(null)
  }, [vocab])

  useEffect(() => {
    setScore({ correct: 0, total: 0 })
    genQuestion()
  }, [vocab])

  const handleAnswer = (opt: VocabEntry) => {
    if (answered || !question) return
    const ok = opt.id === question.correct.id
    setAnswered({ selId: opt.id, ok })
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }))
  }

  if (vocab.length < 4) return (
    <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
      Выберите тему с как минимум 4 словами.
    </div>
  )

  if (!question) return null

  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', fontSize: '12px', color: 'var(--muted)' }}>
        <span>Вопросов: {score.total}</span>
        {accuracy !== null && (
          <span style={{ color: accuracy >= 70 ? 'var(--green)' : 'var(--red)' }}>
            {score.correct} / {score.total} ({accuracy}%)
          </span>
        )}
      </div>

      {/* Question */}
      <div style={{
        background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: '12px', padding: '28px 24px',
        textAlign: 'center', marginBottom: '18px',
      }}>
        <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '10px' }}>
          Как по-гречески?
        </div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '28px', fontWeight: 600, color: 'var(--cream)' }}>
          {question.correct.russian}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '8px' }}>
          {question.correct.topic?.name_ru ?? ''}
        </div>
      </div>

      {/* Options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px', marginBottom: '14px' }}>
        {question.opts.map((opt) => {
          let bg = 'var(--card)', border = 'var(--border)', color = 'var(--cream)'
          if (answered) {
            if (opt.id === question.correct.id) { bg = 'var(--green-bg)'; border = 'var(--green)'; color = 'var(--green)' }
            else if (opt.id === answered.selId && !answered.ok) { bg = 'var(--red-bg)'; border = 'var(--red)'; color = 'var(--red)' }
          }
          return (
            <button
              key={opt.id}
              onClick={() => handleAnswer(opt)}
              style={{
                padding: '13px 14px',
                background: bg,
                border: `1px solid ${border}`,
                borderRadius: '8px',
                color,
                fontSize: '14px',
                fontFamily: "'Playfair Display', serif",
                fontWeight: 600,
                cursor: answered ? 'default' : 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              {opt.greek}
            </button>
          )
        })}
      </div>

      {answered && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: answered.ok ? 'var(--green)' : 'var(--red)', marginBottom: '12px' }}>
            {answered.ok ? 'Правильно!' : `Правильный ответ: ${question.correct.greek}`}
          </div>
          <button
            onClick={genQuestion}
            style={{
              padding: '10px 28px',
              background: 'var(--amber)', border: 'none',
              color: '#0d1b2a', fontWeight: 600,
              borderRadius: '6px', fontSize: '14px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Следующий →
          </button>
        </div>
      )}
    </div>
  )
}
