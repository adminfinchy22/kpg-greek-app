-- Sprint 7 follow-up: the catalog treats legacy NULL pos rows as noun-like.
-- The original heuristic backfill only matched pos = 'noun', so existing catalogs
-- with untagged nouns kept rendering empty declension data after migration.

INSERT INTO public.noun_forms (vocab_id, nom_sg, acc_sg, gen_sg, nom_pl)
SELECT
  v.id,
  i.nom_sg,
  i.acc_sg,
  i.gen_sg,
  i.nom_pl
FROM public.vocab v
CROSS JOIN LATERAL public._noun_forms_infer(public._lemma_strip_article(v.greek)) AS i(nom_sg, acc_sg, gen_sg, nom_pl)
WHERE (v.pos = 'noun' OR v.pos IS NULL)
  AND NOT EXISTS (SELECT 1 FROM public.noun_forms nf WHERE nf.vocab_id = v.id)
  AND i.nom_sg IS NOT NULL
ON CONFLICT (vocab_id) DO NOTHING;
