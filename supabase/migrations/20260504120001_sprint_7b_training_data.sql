-- Sprint 7B (minimal automated seed) — future indicative + placeholder examples
-- Future: demotic pattern θα + present stem (same surface as present indicative in most rows here).
-- Aorist: add in a follow-up migration when paradigms are curated (many suppletive stems).

DELETE FROM public.verb_forms WHERE tense = 'future';

INSERT INTO public.verb_forms (vocab_id, person, tense, form)
SELECT vocab_id, person, 'future', 'θα ' || form
FROM public.verb_forms
WHERE tense = 'present';

-- Idempotent example seed: one row per (vocab_id, sort_order) via ON CONFLICT
INSERT INTO public.word_examples (vocab_id, sentence_el, sentence_ru, tense, sort_order)
SELECT
  v.id,
  '«' || v.greek || '» — λέω στη Λεμεσό (IT).',
  '«' || v.russian || '» — говорю в Лимасоле (IT).',
  'present',
  1
FROM public.vocab v
WHERE v.pos = 'verb'
ON CONFLICT (vocab_id, sort_order) DO NOTHING;

INSERT INTO public.word_examples (vocab_id, sentence_el, sentence_ru, tense, sort_order)
SELECT
  v.id,
  'Αύριο ' || coalesce(
    (SELECT vf.form FROM public.verb_forms vf WHERE vf.vocab_id = v.id AND vf.tense = 'future' AND vf.person = '1sg' LIMIT 1),
    '…'
  ) || ' πάλι (Λεμεσός).',
  'Завтра снова (Лимасол) — ' || v.russian || '.',
  'future',
  2
FROM public.vocab v
WHERE v.pos = 'verb'
  AND EXISTS (
    SELECT 1 FROM public.verb_forms vf
    WHERE vf.vocab_id = v.id AND vf.tense = 'future' AND vf.person = '1sg'
  )
ON CONFLICT (vocab_id, sort_order) DO NOTHING;

INSERT INTO public.word_examples (vocab_id, sentence_el, sentence_ru, tense, sort_order)
SELECT
  v.id,
  'Γενικά: «' || v.greek || '» είναι χρήσιμο στην Κατερίνη.',
  'В целом «' || v.russian || '» полезно в Катерини.',
  'general',
  3
FROM public.vocab v
WHERE v.pos = 'verb'
ON CONFLICT (vocab_id, sort_order) DO NOTHING;
