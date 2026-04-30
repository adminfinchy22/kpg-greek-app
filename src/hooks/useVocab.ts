import { useEffect, useState } from 'react'
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

  useEffect(() => {
    supabase
      .from('topics')
      .select('*')
      .order('sort_order')
      .then(({ data, error }: TopicsQueryResult) => {
        if (error) setError(error.message)
        else setTopics(data ?? [])
        setLoading(false)
      })
  }, [])

  return { topics, loading, error }
}

export function useVocab(topicId: number | null) {
  const [vocab, setVocab] = useState<VocabEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    const query = supabase
      .from('vocab')
      .select('*, topic:topics(id, name_ru, sort_order)')

    const filtered = topicId ? query.eq('topic_id', topicId) : query

    filtered.order('id').then(({ data, error }: VocabQueryResult) => {
      if (error) setError(error.message)
      else setVocab(data ?? [])
      setLoading(false)
    })
  }, [topicId])

  return { vocab, loading, error }
}
