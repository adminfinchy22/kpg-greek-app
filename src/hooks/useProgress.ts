import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type KnownProgressRow = { vocab_id: number }
type ExistingProgressRow = { id: number; review_count: number | null }

export function useProgress() {
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProgress = useCallback(() => {
    setLoading(true)
    setError(null)
    supabase
      .from('user_progress')
      .select('vocab_id')
      .eq('known', true)
      .then(({ data, error: qError }) => {
        if (qError) {
          setError(qError.message)
        } else {
          setKnown(new Set((data ?? []).map((r: KnownProgressRow) => r.vocab_id)))
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

    const rollback = () => {
      setKnown((prev) => {
        const next = new Set(prev)
        if (wasKnown) next.add(vocabId)
        else next.delete(vocabId)
        return next
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

  const knownCount = known.size

  return { known, knownCount, toggleKnown, loading, error, refetch: fetchProgress }
}
