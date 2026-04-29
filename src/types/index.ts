export interface Topic {
  id: number
  name_ru: string
  sort_order: number
}

export interface VocabEntry {
  id: number
  greek: string
  russian: string
  topic_id: number
  notes: string | null
  topic?: Topic
}

export interface Phrase {
  id: number
  topic: string
  pattern: string
  translation: string
  examiner_q: string | null
  examiner_q_ru: string | null
  sort_order: number
}

export interface UserProgress {
  id: number
  vocab_id: number
  known: boolean
  last_reviewed: string | null
  review_count: number
}

export interface TestQuestion {
  correct: VocabEntry
  opts: VocabEntry[]
}
