import { PERSON_ORDER, PERSON_LABEL_SHORT } from '../lib/verbLabels'
import type { Verb, VerbForm, VerbPerson } from '../types'

interface Props {
  verbs: Verb[]
}

function formForPerson(forms: VerbForm[], person: VerbPerson): string {
  const row = forms.find((f) => f.person === person)
  return row?.form ?? '—'
}

export default function VerbList({ verbs }: Props) {
  if (verbs.length === 0) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: '14px' }}>
        Нет глаголов для выбранных фильтров.
      </div>
    )
  }

  return (
    <div>
      <p style={{
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '.08em',
        color: 'var(--muted)',
        marginBottom: '14px',
      }}>
        Справочник · {verbs.length} глаг.
      </p>

      {verbs.map((v) => (
        <div
          key={v.id}
          style={{
            marginBottom: '18px',
            padding: '14px 16px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <span style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '19px',
              color: 'var(--amber-lt)',
            }}>
              {v.greek}
            </span>
            <span style={{ color: 'var(--muted)', margin: '0 10px' }}>·</span>
            <span style={{ fontSize: '14px', color: 'var(--cream-dim)' }}>{v.russian}</span>
            {v.semantic_group && (
              <span style={{
                marginLeft: '10px',
                fontSize: '10px',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: 'var(--muted)',
              }}>
                {v.semantic_group.replace('_', ' ')}
              </span>
            )}
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
                  <td style={{
                    padding: '4px 8px 4px 0',
                    color: 'var(--muted)',
                    width: '88px',
                    whiteSpace: 'nowrap',
                  }}>
                    {PERSON_LABEL_SHORT[p]}
                  </td>
                  <td style={{ padding: '4px 0', fontFamily: 'Georgia, serif' }}>
                    {formForPerson(v.verb_forms, p)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
