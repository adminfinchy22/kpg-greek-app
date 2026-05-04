import { useMemo, useState } from 'react'
import { formForPersonTense } from '../lib/verbFormLookup'
import { PERSON_LABEL_SHORT, PERSON_ORDER } from '../lib/verbLabels'
import { wantsNounDeclension } from '../lib/vocabFormsPolicy'
import { useWordExamples } from '../hooks/useWordExamples'
import { useWordForms } from '../hooks/useWordForms'
import type { VocabEntry } from '../types'

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
  word: VocabEntry
  onClose: () => void
  onStartTrain?: (word: VocabEntry) => void
}

export default function WordDetail({ word, onClose, onStartTrain }: Props) {
  const { data: formsData, loading: formsLoading } = useWordForms(word.id, word.pos ?? null)
  const { examples, loading: exLoading } = useWordExamples(word.id)
  const [verbTense, setVerbTense] = useState('present')

  const verbForms = formsData.kind === 'verb' ? formsData.forms : []
  const tensesPresent = useMemo(() => {
    const s = new Set(verbForms.map((f) => f.tense))
    return TENSE_TABS.filter((t) => s.has(t.key))
  }, [verbForms])

  const posLabel =
    word.pos === 'verb'
      ? 'глагол'
      : word.pos === 'adj'
        ? 'прилаг.'
        : word.pos === 'adv'
          ? 'нареч.'
          : word.pos === 'expression'
            ? 'выражение'
            : word.pos === 'noun'
              ? 'сущ.'
              : word.pos
                ? word.pos
                : 'слово'

  const showNounGrid = wantsNounDeclension(word.pos)

  return (
    <div
      role="dialog"
      aria-modal
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '26px', color: 'var(--amber-lt)' }}>
                {word.greek}
              </span>
              {word.level && (
                <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'var(--card)', color: 'var(--muted)' }}>
                  {word.level}
                </span>
              )}
              <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'var(--card-hover)', color: 'var(--cream-dim)' }}>
                {posLabel}
              </span>
            </div>
            <p style={{ margin: '10px 0 0', fontSize: '15px', color: 'var(--cream-dim)' }}>{word.russian}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--cream)',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '12px',
            }}
          >
            ✕
          </button>
        </div>

        {formsLoading || exLoading ? (
          <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Загрузка…</p>
        ) : (
          <>
            {word.pos === 'verb' && (
              <>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px' }}>
                  Формы
                </div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {(tensesPresent.length ? tensesPresent : TENSE_TABS).map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setVerbTense(key)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: `1px solid ${verbTense === key ? 'var(--amber)' : 'var(--border)'}`,
                        background: verbTense === key ? 'var(--card)' : 'transparent',
                        color: verbTense === key ? 'var(--amber-lt)' : 'var(--cream-dim)',
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
                        <td style={{ padding: '6px 0', fontFamily: 'Georgia, serif' }}>{formForPersonTense(verbForms, p, verbTense)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {showNounGrid && (
              <>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px' }}>
                  Склонение
                </div>
                {formsData.kind === 'noun' && formsData.forms && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '18px' }}>
                    <tbody>
                      {[
                        ['nom.sg', formsData.forms.nom_sg],
                        ['acc.sg', formsData.forms.acc_sg],
                        ['gen.sg', formsData.forms.gen_sg],
                        ['nom.pl', formsData.forms.nom_pl],
                      ].map(([label, val]) => (
                        <tr key={String(label)}>
                          <td style={{ padding: '6px 8px 6px 0', color: 'var(--muted)' }}>{label}</td>
                          <td style={{ padding: '6px 0', fontFamily: 'Georgia, serif' }}>{val ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {formsData.kind === 'noun' && !formsData.forms && (
                  <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Склонения пока не добавлены.</p>
                )}
              </>
            )}

            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px' }}>
              Примеры
            </div>
            {examples.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '16px' }}>Примеры появятся после загрузки данных.</p>
            ) : (
              <ul style={{ margin: '0 0 16px', paddingLeft: '18px', fontSize: '13px', lineHeight: 1.5 }}>
                {examples.map((ex) => (
                  <li key={ex.id} style={{ marginBottom: '10px' }}>
                    <span style={{ color: 'var(--amber-lt)', fontSize: '10px', marginRight: '6px' }}>
                      {TENSE_LABEL_RU[ex.tense] ?? ex.tense}
                    </span>
                    {ex.sentence_el}
                    <div style={{ color: 'var(--cream-dim)', marginTop: '4px' }}>{ex.sentence_ru}</div>
                  </li>
                ))}
              </ul>
            )}

            {onStartTrain && (
              <button
                type="button"
                onClick={() => onStartTrain(word)}
                style={{
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
                }}
              >
                Учить это слово
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
