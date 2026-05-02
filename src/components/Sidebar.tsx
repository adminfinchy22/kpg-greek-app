import type { Topic, VocabEntry } from '../types'
import { VERB_SEMANTIC_GROUPS } from '../types'

interface Props {
  topics: Topic[]
  allVocab: VocabEntry[]
  selectedTopicId: number | null
  onSelect: (topicId: number | null) => void
  totalCount?: number
  countByTopicId?: Record<number, number>
  /** Глаголы tab: filter by `semantic_group` */
  verbSemanticGroup?: string | null
  onVerbSemanticGroup?: (group: string | null) => void
  showVerbSemanticFilter?: boolean
}

export default function Sidebar({
  topics,
  allVocab,
  selectedTopicId,
  onSelect,
  totalCount,
  countByTopicId,
  verbSemanticGroup = null,
  onVerbSemanticGroup,
  showVerbSemanticFilter = false,
}: Props) {
  const countFor = (topicId: number) =>
    countByTopicId?.[topicId] ?? allVocab.filter((v) => v.topic_id === topicId).length
  const displayTotal = totalCount ?? allVocab.length

  const verbsInTopic = (topicId: number) =>
    allVocab.filter(
      (v) =>
        v.topic_id === topicId &&
        v.pos === 'verb' &&
        (!verbSemanticGroup || v.semantic_group === verbSemanticGroup),
    ).length

  const verbsTotalFiltered =
    allVocab.filter(
      (v) =>
        v.pos === 'verb' &&
        (!verbSemanticGroup || v.semantic_group === verbSemanticGroup),
    ).length

  const topicListTotal = showVerbSemanticFilter ? verbsTotalFiltered : displayTotal

  return (
    <div style={{ width: '190px', flexShrink: 0, marginRight: '20px' }}>
      {showVerbSemanticFilter && onVerbSemanticGroup && (
        <>
          <div style={{
            fontSize: '10px', textTransform: 'uppercase',
            letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px',
          }}>
            Группа
          </div>
          <SidebarItem
            label="Все группы"
            active={verbSemanticGroup === null}
            onClick={() => onVerbSemanticGroup(null)}
          />
          {VERB_SEMANTIC_GROUPS.map(({ value, labelRu }) => (
            <SidebarItem
              key={value}
              label={labelRu}
              active={verbSemanticGroup === value}
              onClick={() => onVerbSemanticGroup(value)}
            />
          ))}
          <div style={{ height: '16px' }} />
        </>
      )}

      <div style={{
        fontSize: '10px', textTransform: 'uppercase',
        letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '8px',
      }}>
        Тема
      </div>

      <SidebarItem
        label={`Все (${topicListTotal})`}
        active={selectedTopicId === null}
        onClick={() => onSelect(null)}
      />

      {topics.map((t) => (
        <SidebarItem
          key={t.id}
          label={`${t.name_ru} (${showVerbSemanticFilter ? verbsInTopic(t.id) : countFor(t.id)})`}
          active={selectedTopicId === t.id}
          onClick={() => onSelect(t.id)}
        />
      ))}
    </div>
  )
}

function SidebarItem({
  label, active, onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        padding: '6px 10px 6px 12px',
        background: active ? 'var(--card)' : 'transparent',
        border: active ? '1px solid var(--border)' : '1px solid transparent',
        borderLeft: active ? '3px solid var(--amber)' : '3px solid transparent',
        color: active ? 'var(--cream)' : 'var(--cream-dim)',
        borderRadius: '3px', fontSize: '11.5px',
        marginBottom: '2px', transition: 'all 0.12s',
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--card-hover)'
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {label}
    </button>
  )
}
