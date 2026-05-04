import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { wantsNounDeclension } from '../lib/vocabFormsPolicy'
import type { NounForm, VerbForm } from '../types'

export type WordFormsData =
  | { kind: 'verb'; forms: VerbForm[] }
  | { kind: 'noun'; forms: NounForm | null }
  | { kind: 'none' }

export function useWordForms(vocabId: number | null, pos: string | null | undefined) {
  const [data, setData] = useState<WordFormsData>({ kind: 'none' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchForms = useCallback(() => {
    if (vocabId == null) {
      setData({ kind: 'none' })
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    if (pos === 'verb') {
      supabase
        .from('verb_forms')
        .select('id, vocab_id, person, tense, form')
        .eq('vocab_id', vocabId)
        .order('tense')
        .order('person')
        .then(({ data: d, error: qError }) => {
          if (qError) setError(qError.message)
          else setData({ kind: 'verb', forms: (d ?? []) as VerbForm[] })
          setLoading(false)
        })
      return
    }

    if (!wantsNounDeclension(pos)) {
      setData({ kind: 'none' })
      setLoading(false)
      return
    }

    supabase
      .from('noun_forms')
      .select('id, vocab_id, nom_sg, acc_sg, gen_sg, nom_pl')
      .eq('vocab_id', vocabId)
      .maybeSingle<NounForm>()
      .then(({ data: d, error: qError }) => {
        if (qError) setError(qError.message)
        else setData({ kind: 'noun', forms: d ?? null })
        setLoading(false)
      })
  }, [vocabId, pos])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- vocabId / pos / refetch
    fetchForms()
  }, [fetchForms])

  return { data, loading, error, refetch: fetchForms }
}
