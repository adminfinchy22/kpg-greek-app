import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { WordStatus } from '../types'

type WordStatusRow = WordStatus

export type StatusBucket = 'new' | 'studying' | 'due' | 'learned'

function emptyBuckets(): Record<StatusBucket, number> {
  return { new: 0, studying: 0, due: 0, learned: 0 }
}

export function useWordStatus(topicId: number | null) {
  const [rows, setRows] = useState<WordStatusRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRows = useCallback(() => {
    setLoading(true)
    setError(null)
    let q = supabase.from('word_status').select('*')
    if (topicId !== null) q = q.eq('topic_id', topicId)
    q.then(({ data, error: qError }) => {
      if (qError) setError(qError.message)
      else setRows((data ?? []) as WordStatusRow[])
      setLoading(false)
    })
  }, [topicId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount / topicId / refetch
    fetchRows()
  }, [fetchRows])

  const counts = useMemo(() => {
    const c = emptyBuckets()
    for (const r of rows) {
      const s = r.status as StatusBucket
      if (s in c) c[s] += 1
    }
    return c
  }, [rows])

  const dueList = useMemo(
    () => rows.filter((r) => r.status === 'due').sort((a, b) => a.greek.localeCompare(b.greek)),
    [rows],
  )

  return { rows, counts, dueList, loading, error, refetch: fetchRows }
}

/** Aggregate word_status rows already filtered to one topic (or all). */
export function aggregateStatusByTopic(rows: WordStatusRow[]): Record<number, Record<StatusBucket, number>> {
  const out: Record<number, Record<StatusBucket, number>> = {}
  for (const r of rows) {
    if (!out[r.topic_id]) out[r.topic_id] = emptyBuckets()
    const s = r.status as StatusBucket
    if (s in out[r.topic_id]) out[r.topic_id][s] += 1
  }
  return out
}
