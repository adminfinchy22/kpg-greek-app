import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { VocabEntry, Topic } from '../types'

type QueryError = { message: string }
type TopicsQueryResult = {
  data: Topic[] | null
  error: QueryError | null
}
type VocabQueryResult = {
  data: VocabEntry[] | null
  error: QueryError | null
}

export function useTopics() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTopics = useCallback(() => {
    setLoading(true)
    setError(null)
    supabase
      .from('topics')
      .select('*')
      .order('sort_order')
      .then(({ data, error: qError }: TopicsQueryResult) => {
        if (qError) setError(qError.message)
        else setTopics(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount / refetch entry
    fetchTopics()
  }, [fetchTopics])

  return { topics, loading, error, refetch: fetchTopics }
}

export function useVocab(topicId: number | null) {
  const [vocab, setVocab] = useState<VocabEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchVocab = useCallback(() => {
    setLoading(true)
    setError(null)
    const query = supabase
      .from('vocab')
      .select('*, topic:topics(id, name_ru, sort_order)')

    const filtered = topicId ? query.eq('topic_id', topicId) : query

    filtered.order('id').then(({ data, error: qError }: VocabQueryResult) => {
      if (qError) setError(qError.message)
      else setVocab(data ?? [])
      setLoading(false)
    })
  }, [topicId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount / topicId / refetch
    fetchVocab()
  }, [fetchVocab])

  return { vocab, loading, error, refetch: fetchVocab }
}
