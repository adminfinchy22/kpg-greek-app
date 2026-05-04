import type { VerbForm, VerbPerson } from '../types'

export function formsForTense(forms: VerbForm[] | undefined, tense: string): VerbForm[] {
  if (!forms?.length) return []
  return forms.filter((f) => f.tense === tense)
}

export function formForPersonTense(
  forms: VerbForm[] | undefined,
  person: VerbPerson,
  tense: string,
): string {
  const row = forms?.find((f) => f.person === person && f.tense === tense)
  return row?.form?.trim() ? row.form : '—'
}
