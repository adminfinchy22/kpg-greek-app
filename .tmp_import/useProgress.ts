import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useProgress() {
  const [known, setKnown] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  // Load all known vocab IDs on mount
  useEffect(() => {
    supabase
      .from('user_progress')
      .select('vocab_id')
      .eq('known', true)
      .then(({ data }) => {
        if (data) {
          setKnown(new Set(data.map((r) => r.vocab_id)))
        }
        setLoading(false)
      })
  }, [])

  // Toggle a word as known / unknown
  const toggleKnown = useCallback(async (vocabId: number) => {
    const isKnown = known.has(vocabId)

    // Optimistic UI update
    setKnown((prev) => {
      const next = new Set(prev)
      isKnown ? next.delete(vocabId) : next.add(vocabId)
      return next
    })

    // Check if a progress row already exists
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('vocab_id', vocabId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('user_progress')
        .update({
          known: !isKnown,
          last_reviewed: new Date().toISOString(),
          review_count: existing ? undefined : 1,
        })
        .eq('vocab_id', vocabId)
    } else {
      await supabase.from('user_progress').insert({
        vocab_id: vocabId,
        known: true,
        last_reviewed: new Date().toISOString(),
        review_count: 1,
      })
    }
  }, [known])

  const knownCount = known.size

  return { known, knownCount, toggleKnown, loading }
}
