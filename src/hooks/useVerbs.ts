import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Verb, VerbForm, Topic } from '../types'

type VerbRow = {
  id: number
  greek: string
  russian: string
  topic_id: number
  notes: string | null
  pos: string | null
  semantic_group: string | null
  topic?: Topic | Topic[] | null
  verb_forms?: VerbForm[] | VerbForm | null
}

function unwrapTopic(t: Topic | Topic[] | null | undefined): Topic | undefined {
  if (t == null) return undefined
  return Array.isArray(t) ? t[0] : t
}

function unwrapVerbForms(f: VerbForm[] | VerbForm | null | undefined): VerbForm[] {
  if (f == null) return []
  return Array.isArray(f) ? f : [f]
}

export interface UseVerbsOptions {
  /** When set, restrict to this topic; omit or null = all topics */
  topicId?: number | null
  /** When set, only verbs with this `semantic_group` */
  semanticGroup: string | null
  /** When false, skip fetch (e.g. other tabs) */
  enabled?: boolean
}

function normalizeVerb(row: VerbRow): Verb {
  return {
    id: row.id,
    greek: row.greek,
    russian: row.russian,
    topic_id: row.topic_id,
    notes: row.notes,
    pos: 'verb',
    semantic_group: row.semantic_group,
    topic: unwrapTopic(row.topic),
    verb_forms: unwrapVerbForms(row.verb_forms),
  }
}

export function useVerbs({ topicId = null, semanticGroup, enabled = true }: UseVerbsOptions) {
  const [verbs, setVerbs] = useState<Verb[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVerbs = useCallback(() => {
    if (!enabled) {
      setVerbs([])
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let q = supabase
      .from('vocab')
      .select(
        `
        id,
        greek,
        russian,
        topic_id,
        notes,
        pos,
        semantic_group,
        topic:topics(id, name_ru, sort_order),
        verb_forms(id, vocab_id, person, tense, form)
      `,
      )
      .eq('pos', 'verb')

    if (topicId != null) q = q.eq('topic_id', topicId)
    if (semanticGroup) q = q.eq('semantic_group', semanticGroup)

    q.order('id').then((res) => {
      const { data, error: qError } = res
      if (qError) setError(qError.message)
      else setVerbs(((data ?? []) as VerbRow[]).map(normalizeVerb))
      setLoading(false)
    })
  }, [topicId, semanticGroup, enabled])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount / filters / refetch
    fetchVerbs()
  }, [fetchVerbs])

  return { verbs, loading, error, refetch: fetchVerbs }
}
