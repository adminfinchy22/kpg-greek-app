export interface Topic {
  id: number
  name_ru: string
  sort_order: number
  icon?: string | null
  color?: string | null
}

export interface VocabEntry {
  id: number
  greek: string
  russian: string
  topic_id: number
  notes: string | null
  /** Sprint 6A — part of speech in Supabase (verb, adv, num, expression, …) */
  pos?: string | null
  /** Sprint 6A — verb study grouping when pos is verb */
  semantic_group?: string | null
  /** Sprint 7 — CEFR tag */
  level?: string | null
  topic?: Topic
}

export interface NounForm {
  id: number
  vocab_id: number
  nom_sg: string | null
  acc_sg: string | null
  gen_sg: string | null
  nom_pl: string | null
}

export interface WordExample {
  id: number
  vocab_id: number
  sentence_el: string
  sentence_ru: string
  tense: 'present' | 'future' | 'aorist' | 'general'
  sort_order: number
}

export interface WordStatus {
  vocab_id: number
  greek: string
  russian: string
  topic_id: number
  pos: string | null
  status: 'new' | 'studying' | 'due' | 'learned'
  due_at: string | null
  review_count: number | null
  known: boolean
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
  /** Sprint 7 — next review time (nullable until first scheduled review) */
  due_at?: string | null
}

export interface TestQuestion {
  correct: VocabEntry
  opts: VocabEntry[]
}

/** Present-tense person keys (matches `verb_forms.person` in Supabase) */
export type VerbPerson = '1sg' | '2sg' | '3sg' | '1pl' | '2pl' | '3pl'

export interface VerbForm {
  id: number
  vocab_id: number
  person: VerbPerson
  tense: string
  form: string
}

/** `pos` = verb + nested conjugation rows from `verb_forms` */
export interface Verb extends VocabEntry {
  pos: 'verb'
  verb_forms: VerbForm[]
}

/** Labels for sidebar filter (values match `vocab.semantic_group`) */
export const VERB_SEMANTIC_GROUPS: { value: string; labelRu: string }[] = [
  { value: 'movement', labelRu: 'Передвижение' },
  { value: 'cognition', labelRu: 'Мышление' },
  { value: 'daily_routine', labelRu: 'Быт / рутина' },
  { value: 'communication', labelRu: 'Общение' },
  { value: 'household', labelRu: 'Дом / хозяйство' },
]
