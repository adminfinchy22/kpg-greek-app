import type { Phrase, Verb } from '../types'

export interface SentenceDrillItem {
  phraseId: number
  /** Greek pattern with matched verb replaced by blanks */
  patternMasked: string
  /** Expected Greek form (as it appears in the phrase) */
  answer: string
  translation: string
}

/**
 * Build drills by finding the longest matching verb form or lemma inside
 * `phrase.pattern`. One drill per phrase (first match wins).
 */
export function buildSentenceDrillItems(phrases: Phrase[], verbs: Verb[]): SentenceDrillItem[] {
  const needles: { needle: string; answer: string }[] = []
  for (const v of verbs) {
    const forms = new Set<string>()
    forms.add(v.greek)
    for (const f of v.verb_forms ?? []) {
      if (f.form?.trim()) forms.add(f.form.trim())
    }
    for (const needle of forms) {
      if (needle.length < 3) continue
      needles.push({ needle, answer: needle })
    }
  }
  needles.sort((a, b) => b.needle.length - a.needle.length)

  const items: SentenceDrillItem[] = []
  for (const p of phrases) {
    const text = p.pattern
    let hit: { needle: string; answer: string } | null = null
    for (const n of needles) {
      if (text.includes(n.needle)) {
        hit = n
        break
      }
    }
    if (!hit) continue
    const i = text.indexOf(hit.needle)
    const patternMasked = text.slice(0, i) + '_____' + text.slice(i + hit.needle.length)
    items.push({
      phraseId: p.id,
      patternMasked,
      answer: hit.answer,
      translation: p.translation,
    })
  }
  return items
}
