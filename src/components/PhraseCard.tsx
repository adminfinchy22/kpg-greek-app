import { useState } from 'react'
import type { Phrase } from '../types'

interface Props {
  grouped: Record<string, Phrase[]>
  total: number
}

export default function PhraseCard({ grouped, total }: Props) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div>
      <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
        Типовые конструкции для устной части KPG A2 · {total} шаблонов
      </div>

      {Object.entries(grouped).map(([grp, items]) => (
        <div key={grp} style={{ marginBottom: '22px' }}>
          <div style={{
            fontSize: '10px', textTransform: 'uppercase',
            letterSpacing: '.1em', color: 'var(--amber)',
            marginBottom: '8px', paddingLeft: '2px',
          }}>
            {grp}
          </div>

          {items.map((ph) => {
            const key = `${grp}-${ph.id}`
            const isOpen = open === key
            return (
              <div key={ph.id} style={{
                background: 'var(--card)',
                border: `1px solid ${isOpen ? 'var(--amber)' : 'var(--border)'}`,
                borderRadius: '8px', marginBottom: '7px',
                overflow: 'hidden', transition: 'border-color 0.2s',
              }}>
                <div
                  onClick={() => setOpen(isOpen ? null : key)}
                  style={{
                    padding: '13px 16px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-start', gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--cream)' }}>
                      {ph.pattern}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px', fontStyle: 'italic' }}>
                      {ph.translation}
                    </div>
                  </div>
                  <span style={{ color: 'var(--amber)', fontSize: '18px', flexShrink: 0, lineHeight: 1 }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </div>

                {isOpen && ph.examiner_q && (
                  <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)' }}>
                    <div style={{
                      fontSize: '10px', textTransform: 'uppercase',
                      letterSpacing: '.08em', color: 'var(--muted)',
                      margin: '12px 0 5px',
                    }}>
                      Вопрос экзаменатора
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--muted)', fontStyle: 'italic', lineHeight: 1.6 }}>
                      {ph.examiner_q}
                    </div>
                    {ph.examiner_q_ru && (
                      <div style={{ fontSize: '12px', color: 'var(--cream-dim)', marginTop: '3px', fontStyle: 'italic' }}>
                        {ph.examiner_q_ru}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
