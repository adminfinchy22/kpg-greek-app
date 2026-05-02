import type { VerbPerson } from '../types'

export const PERSON_ORDER: VerbPerson[] = ['1sg', '2sg', '3sg', '1pl', '2pl', '3pl']

export const PERSON_LABEL_EL: Record<VerbPerson, string> = {
  '1sg': 'Εγώ …',
  '2sg': 'Εσύ …',
  '3sg': 'Αυτός / αυτή / αυτό …',
  '1pl': 'Εμείς …',
  '2pl': 'Εσείς …',
  '3pl': 'Αυτοί / αυτές / αυτά …',
}

export const PERSON_LABEL_SHORT: Record<VerbPerson, string> = {
  '1sg': 'εγώ',
  '2sg': 'εσύ',
  '3sg': 'αυτός/ή/ό',
  '1pl': 'εμείς',
  '2pl': 'εσείς',
  '3pl': 'αυτοί/ές/ά',
}
