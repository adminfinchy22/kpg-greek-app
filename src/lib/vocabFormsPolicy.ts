/**
 * Whether this POS uses the `noun_forms` table (4-case snapshot).
 * Adjectives, adverbs, fixed phrases, etc. use lemma/phrase form only — no declension grid.
 */
export function wantsNounDeclension(pos: string | null | undefined): boolean {
  if (pos === 'verb') return false
  if (pos === 'adj' || pos === 'adv' || pos === 'expression' || pos === 'num') return false
  // `noun`, untagged rows (null), or other legacy tags — still query noun_forms
  return true
}
