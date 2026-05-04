import { supabase } from './supabase'
import type { VerbForm } from '../types'

export async function fetchVerbFormsMap(vocabIds: number[]): Promise<Map<number, VerbForm[]>> {
  if (!vocabIds.length) return new Map()
  const { data, error } = await supabase
    .from('verb_forms')
    .select('id, vocab_id, person, tense, form')
    .in('vocab_id', vocabIds)
  if (error || !data) return new Map()
  const m = new Map<number, VerbForm[]>()
  for (const row of data as VerbForm[]) {
    const arr = m.get(row.vocab_id) ?? []
    arr.push(row)
    m.set(row.vocab_id, arr)
  }
  return m
}
