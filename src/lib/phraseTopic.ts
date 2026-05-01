import type { Phrase, Topic } from '../types'

export function buildNormalizedTopicNameById(topics: Topic[]): Map<number, string> {
  const map = new Map<number, string>()
  topics.forEach((topic) => {
    map.set(topic.id, topic.name_ru.trim().toLowerCase())
  })
  return map
}

export function filterGroupedPhrasesByTopicSelection(
  grouped: Record<string, Phrase[]>,
  selectedTopicId: number | null,
  normalizedTopicNameById: Map<number, string>
): Record<string, Phrase[]> {
  if (selectedTopicId === null) return grouped
  const selectedName = normalizedTopicNameById.get(selectedTopicId)
  if (!selectedName) return {}

  return Object.fromEntries(
    Object.entries(grouped).filter(
      ([topicName]) => topicName.trim().toLowerCase() === selectedName
    )
  )
}

export function phraseCountByTopicId(
  grouped: Record<string, Phrase[]>,
  topics: Topic[]
): Record<number, number> {
  const byTopicName = new Map<string, number>()
  Object.entries(grouped).forEach(([topicName, items]) => {
    byTopicName.set(topicName.trim().toLowerCase(), items.length)
  })

  const result: Record<number, number> = {}
  topics.forEach((topic) => {
    const normalizedName = topic.name_ru.trim().toLowerCase()
    result[topic.id] = byTopicName.get(normalizedName) ?? 0
  })
  return result
}

export function sumGroupedPhraseCounts(grouped: Record<string, Phrase[]>): number {
  return Object.values(grouped).reduce((acc, items) => acc + items.length, 0)
}
