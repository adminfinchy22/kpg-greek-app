import { useState } from 'react'
import { formForPersonTense } from '../lib/verbFormLookup'
import { PERSON_LABEL_SHORT, PERSON_ORDER } from '../lib/verbLabels'
import { useWordExamples } from '../hooks/useWordExamples'
import type { Verb } from '../types'

const TENSE_TABS: { key: string; label: string }[] = [
  { key: 'present', label: 'Настоящее' },
  { key: 'future', label: 'Будущее' },
  { key: 'aorist', label: 'Прошедшее' },
]

const TENSE_LABEL_RU: Record<string, string> = {
  present: 'Наст.',
  future: 'Буд.',
  aorist: 'Аор.',
  general: 'Общ.',
}

interface Props {
  verb: Verb
  onClose: () => void
  onTrain?: (verb: Verb) => void
}

export default function VerbDetail({ verb, onClose, onTrain }: Props) {
  const [tense, setTense] = useState('present')
  const { examples } = useWordExamples(verb.id)

  const tenses = TENSE_TABS.filter((t) => verb.verb_forms.some((f) => f.tense === t.key))

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        background: 'rgba(13, 27, 42, 0.72)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '12px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '88vh',
          overflow: 'auto',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px 14px 0 0',
          padding: '20px 18px 24px',
          color: 'var(--cream)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', color: 'var(--amber-lt)' }}>{verb.greek}</span>
            <p style={{ margin: '8px 0 0', color: 'var(--cream-dim)' }}>{verb.russian}</p>
          </div>
          <button type="button" onClick={onClose} style={closeBtn}>
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
          {(tenses.length ? tenses : TENSE_TABS).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTense(key)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: `1px solid ${tense === key ? 'var(--amber)' : 'var(--border)'}`,
                background: tense === key ? 'var(--card)' : 'transparent',
                color: tense === key ? 'var(--amber-lt)' : 'var(--cream-dim)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '12px',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '18px' }}>
          <tbody>
            {PERSON_ORDER.map((p) => (
              <tr key={p}>
                <td style={{ padding: '6px 8px 6px 0', color: 'var(--muted)', width: '96px' }}>{PERSON_LABEL_SHORT[p]}</td>
                <td style={{ padding: '6px 0', fontFamily: 'Georgia, serif' }}>{formForPersonTense(verb.verb_forms, p, tense)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px' }}>
          Примеры
        </p>
        {examples.length === 0 ? (
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Нет примеров.</p>
        ) : (
          <ul style={{ margin: '0 0 16px', paddingLeft: '18px', fontSize: '13px' }}>
            {examples.map((ex) => (
              <li key={ex.id} style={{ marginBottom: '8px' }}>
                <span style={{ color: 'var(--amber-lt)', fontSize: '10px', marginRight: '6px' }}>
                  {TENSE_LABEL_RU[ex.tense] ?? ex.tense}
                </span>
                {ex.sentence_el}
                <div style={{ color: 'var(--cream-dim)', marginTop: '4px' }}>{ex.sentence_ru}</div>
              </li>
            ))}
          </ul>
        )}

        {onTrain && (
          <button type="button" onClick={() => onTrain(verb)} style={trainBtn}>
            Учить глагол
          </button>
        )}
      </div>
    </div>
  )
}

const closeBtn: React.CSSProperties = {
  border: '1px solid var(--border)',
  background: 'var(--card)',
  color: 'var(--cream)',
  borderRadius: '8px',
  padding: '6px 12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  fontSize: '12px',
  height: 'fit-content',
}

const trainBtn: React.CSSProperties = {
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
