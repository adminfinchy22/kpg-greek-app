import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Phrase } from '../types'

type PhrasesQueryResult = {
  data: Phrase[] | null
  error: { message: string } | null
}

export function usePhrases() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [grouped, setGrouped] = useState<Record<string, Phrase[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('phrases')
      .select('*')
      .order('topic')
      .order('sort_order')
      .then(({ data, error }: PhrasesQueryResult) => {
        if (error) {
          setError(error.message)
        } else {
          const rows: Phrase[] = data ?? []
          setPhrases(rows)
          const g: Record<string, Phrase[]> = {}
          rows.forEach((p: Phrase) => {
            if (!g[p.topic]) g[p.topic] = []
            g[p.topic].push(p)
          })
          setGrouped(g)
        }
        setLoading(false)
      })
  }, [])

  return { phrases, grouped, total: phrases.length, loading, error }
}
