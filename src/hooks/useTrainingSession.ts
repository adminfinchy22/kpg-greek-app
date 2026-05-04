import { useCallback, useMemo, useState } from 'react'
import { shuffleCopy } from '../lib/shuffle'
import { formForPersonTense } from '../lib/verbFormLookup'
import { PERSON_ORDER } from '../lib/verbLabels'
import type { VerbForm, VocabEntry, VerbPerson } from '../types'

export type TrainingStep =
  | { type: 'intro'; word: VocabEntry }
  | { type: 'mcq_recognition'; word: VocabEntry; opts: VocabEntry[] }
  | { type: 'mcq_production'; word: VocabEntry; opts: VocabEntry[] }
  | { type: 'conjugation'; word: VocabEntry; person: VerbPerson; opts: string[]; answer: string }
  | { type: 'typing'; word: VocabEntry }
  | { type: 'results' }

function buildMcqOpts(correct: VocabEntry, pool: VocabEntry[]): VocabEntry[] {
  const others = shuffleCopy(pool.filter((w) => w.id !== correct.id))
  const pick = others.slice(0, 3)
  while (pick.length < 3) {
    if (!others.length) break
    pick.push(others[pick.length % others.length]!)
  }
  return shuffleCopy([correct, ...pick.slice(0, 3)])
}

function randomPerson(): VerbPerson {
  return PERSON_ORDER[Math.floor(Math.random() * PERSON_ORDER.length)]!
}

function buildConjugationStep(
  word: VocabEntry,
  forms: VerbForm[],
): { type: 'conjugation'; word: VocabEntry; person: VerbPerson; opts: string[]; answer: string } | null {
  const person = randomPerson()
  const answer = formForPersonTense(forms, person, 'present')
  if (answer === '—') return null
  const altForms = shuffleCopy(
    forms.filter((f) => f.tense === 'present' && f.form && f.form !== answer).map((f) => f.form!),
  )
  const uniq: string[] = [answer]
  for (const f of altForms) {
    if (!uniq.includes(f)) uniq.push(f)
    if (uniq.length >= 4) break
  }
  while (uniq.length < 4) uniq.push(`${answer}(${uniq.length})`)
  const opts = shuffleCopy(uniq.slice(0, 4))
  return { type: 'conjugation', word, person, opts, answer }
}

export function buildTrainingQueue(
  words: VocabEntry[],
  pool: VocabEntry[],
  verbForms: Map<number, VerbForm[]>,
): TrainingStep[] {
  const q: TrainingStep[] = []
  for (const w of words) {
    q.push({ type: 'intro', word: w })
    q.push({ type: 'mcq_recognition', word: w, opts: buildMcqOpts(w, pool) })
    q.push({ type: 'mcq_production', word: w, opts: buildMcqOpts(w, pool) })
    if (w.pos === 'verb') {
      const forms = verbForms.get(w.id) ?? []
      const conj = buildConjugationStep(w, forms)
      if (conj) q.push(conj)
    }
    q.push({ type: 'typing', word: w })
  }
  q.push({ type: 'results' })
  return q
}

export function useTrainingSession(words: VocabEntry[], pool: VocabEntry[], verbForms: Map<number, VerbForm[]>) {
  const queue = useMemo(
    () => (words.length ? buildTrainingQueue(words, pool, verbForms) : []),
    [words, pool, verbForms],
  )

  const [idx, setIdx] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [graded, setGraded] = useState(0)

  const step = queue[idx] ?? null
  const progressLabel = queue.length ? `${idx + 1} / ${queue.length}` : ''

  const reset = useCallback(() => {
    setIdx(0)
    setCorrect(0)
    setGraded(0)
  }, [])

  const goNext = useCallback(() => {
    setIdx((i) => Math.min(i + 1, Math.max(0, queue.length - 1)))
  }, [queue.length])

  const submitGraded = useCallback(
    (ok: boolean) => {
      setGraded((g) => g + 1)
      setCorrect((c) => c + (ok ? 1 : 0))
      goNext()
    },
    [goNext],
  )

  return {
    queue,
    step,
    idx,
    correct,
    graded,
    progressLabel,
    reset,
    goNext,
    submitGraded,
  }
}
