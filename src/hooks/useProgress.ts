import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type ProgressRow = {
  vocab_id: number
  known: boolean | null
  due_at: string | null
  review_count: number | null
  last_reviewed: string | null
}

type ExistingProgressRow = { id: number; review_count: number | null }

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString()
}

export function useProgress() {
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [progressByVocabId, setProgressByVocabId] = useState<
    Record<number, { known: boolean; due_at: string | null; review_count: number }>
  >({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(() => {
    setLoading(true)
    setError(null)
    supabase
      .from('user_progress')
      .select('vocab_id, known, due_at, review_count, last_reviewed')
      .then(({ data, error: qError }) => {
        if (qError) {
          setError(qError.message)
        } else {
          const rows = (data ?? []) as ProgressRow[]
          const byId: Record<number, { known: boolean; due_at: string | null; review_count: number }> =
            {}
          const learned = new Set<number>()
          for (const r of rows) {
            const k = Boolean(r.known)
            byId[r.vocab_id] = {
              known: k,
              due_at: r.due_at ?? null,
              review_count: r.review_count ?? 0,
            }
            if (k) learned.add(r.vocab_id)
          }
          setProgressByVocabId(byId)
          setKnown(learned)
        }
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount / refetch entry
    fetchProgress()
  }, [fetchProgress])

  const toggleKnown = useCallback(async (vocabId: number) => {
    const wasKnown = known.has(vocabId)

    setKnown((prev) => {
      const next = new Set(prev)
      if (wasKnown) next.delete(vocabId)
      else next.add(vocabId)
      return next
    })
    setProgressByVocabId((prev) => {
      const cur = prev[vocabId] ?? { known: false, due_at: null, review_count: 0 }
      return {
        ...prev,
        [vocabId]: { ...cur, known: !wasKnown },
      }
    })

    const rollback = () => {
      setKnown((prev) => {
        const next = new Set(prev)
        if (wasKnown) next.add(vocabId)
        else next.delete(vocabId)
        return next
      })
      setProgressByVocabId((prev) => {
        const cur = prev[vocabId] ?? { known: false, due_at: null, review_count: 0 }
        return { ...prev, [vocabId]: { ...cur, known: wasKnown } }
      })
    }

    try {
      const { data: existing, error: selectError } = await supabase
        .from('user_progress')
        .select('id, review_count')
        .eq('vocab_id', vocabId)
        .maybeSingle<ExistingProgressRow>()

      if (selectError) throw selectError

      const now = new Date().toISOString()

      if (existing) {
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            known: !wasKnown,
            last_reviewed: now,
            review_count: (existing.review_count ?? 0) + 1,
          })
          .eq('vocab_id', vocabId)

        if (updateError) throw updateError
      } else {
        if (wasKnown) {
          rollback()
          return
        }
        const { error: insertError } = await supabase.from('user_progress').insert({
          vocab_id: vocabId,
          known: true,
          last_reviewed: now,
          review_count: 1,
        })
        if (insertError) throw insertError
      }
    } catch {
      rollback()
    }
  }, [known])

  /** After a training session: schedule next review (~24h) and bump review_count. */
  const recordTrainingReview = useCallback(async (vocabIds: number[]) => {
    const now = new Date().toISOString()
    const due = hoursFromNow(24)
    const unique = [...new Set(vocabIds)]
    for (const vocabId of unique) {
      const { data: existing, error: selectError } = await supabase
        .from('user_progress')
        .select('id, review_count, known')
        .eq('vocab_id', vocabId)
        .maybeSingle<{ id: number; review_count: number | null; known: boolean | null }>()

      if (selectError) throw selectError

      if (existing) {
        const { error: updateError } = await supabase
          .from('user_progress')
          .update({
            last_reviewed: now,
            review_count: (existing.review_count ?? 0) + 1,
            due_at: existing.known ? null : due,
          })
          .eq('vocab_id', vocabId)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from('user_progress').insert({
          vocab_id: vocabId,
          known: false,
          last_reviewed: now,
          review_count: 1,
          due_at: due,
        })
        if (insertError) throw insertError
      }
    }
    await fetchProgress()
  }, [fetchProgress])

  const knownCount = known.size
  const progressRowCount = Object.keys(progressByVocabId).length

  return {
    known,
    knownCount,
    progressByVocabId,
    progressRowCount,
    toggleKnown,
    recordTrainingReview,
    loading,
    error,
    refetch: fetchProgress,
  }
}
