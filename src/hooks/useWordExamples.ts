import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { WordExample } from '../types'

export function useWordExamples(vocabId: number | null) {
  const [examples, setExamples] = useState<WordExample[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExamples = useCallback(() => {
    if (vocabId == null) {
      setExamples([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    supabase
      .from('word_examples')
      .select('*')
      .eq('vocab_id', vocabId)
      .order('sort_order')
      .then(({ data, error: qError }) => {
        if (qError) setError(qError.message)
        else setExamples((data ?? []) as WordExample[])
        setLoading(false)
      })
  }, [vocabId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- vocabId / refetch
    fetchExamples()
  }, [fetchExamples])

  return { examples, loading, error, refetch: fetchExamples }
}
