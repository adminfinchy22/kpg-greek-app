import { useState } from 'react'
import type { Phrase, Verb } from '../types'
import VerbCard from './VerbCard'
import VerbList from './VerbList'
import ConjugationDrill from './ConjugationDrill'
import SentenceDrill from './SentenceDrill'

export type VerbSubMode = 'conjugate' | 'cards' | 'sentence' | 'list'

const SUB_TABS: { key: VerbSubMode; label: string }[] = [
  { key: 'conjugate', label: 'Спряжение' },
  { key: 'cards', label: 'Карточки' },
  { key: 'sentence', label: 'В фразе' },
  { key: 'list', label: 'Список' },
]

interface Props {
  verbs: Verb[]
  phrases: Phrase[]
  known: Set<number>
  knownCountInTopic: number
  onToggleKnown: (id: number) => void
  onOpenVerb?: (v: Verb) => void
}

export default function VerbsPanel({
  verbs,
  phrases,
  known,
  knownCountInTopic,
  onToggleKnown,
  onOpenVerb,
}: Props) {
  const [sub, setSub] = useState<VerbSubMode>('conjugate')

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
        {SUB_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSub(key)}
            style={{
              padding: '7px 14px',
              background: sub === key ? 'var(--card)' : 'transparent',
              border: `1px solid ${sub === key ? 'var(--amber)' : 'var(--border)'}`,
              color: sub === key ? 'var(--amber-lt)' : 'var(--cream-dim)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'list' && <VerbList verbs={verbs} onOpenVerb={onOpenVerb} />}
      {sub === 'cards' && (
        <VerbCard
          verbs={verbs}
          known={known}
          knownCountInTopic={knownCountInTopic}
          onToggleKnown={onToggleKnown}
        />
      )}
      {sub === 'conjugate' && <ConjugationDrill verbs={verbs} />}
      {sub === 'sentence' && <SentenceDrill phrases={phrases} verbs={verbs} />}
    </div>
  )
}
