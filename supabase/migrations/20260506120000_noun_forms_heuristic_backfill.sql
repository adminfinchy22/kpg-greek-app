-- Heuristic backfill for noun_forms (A2-style: nom.sg / acc.sg / gen.sg / nom.pl)
-- Targets vocab.pos = 'noun' without a noun_forms row. Strips leading article from greek.
-- Patterns: neuter -μα/-ιο/-ο, feminine -η/-α, masculine -ος; else all four = lemma (safe fallback).
-- Re-run safe: ON CONFLICT DO UPDATE.

CREATE OR REPLACE FUNCTION public._lemma_strip_article(p_greek text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $f$
  SELECT trim(
    regexp_replace(
      trim(p_greek),
      '^(ο|Ο|η|Η|το|Το|οι|Οι|τα|Τα|τις|Τις|ένα|Ένα|μια|Μια|έναν|Έναν)\s+',
      '',
      ''
    )
  );
$f$;

CREATE OR REPLACE FUNCTION public._noun_forms_infer(p_lemma text)
RETURNS TABLE(nom_sg text, acc_sg text, gen_sg text, nom_pl text)
LANGUAGE plpgsql
IMMUTABLE
AS $f$
DECLARE
  t text := trim(p_lemma);
  tl text := lower(trim(p_lemma));
  n int := char_length(t);
  stem text;
BEGIN
  IF t IS NULL OR t = '' THEN
    RETURN QUERY SELECT NULL::text, NULL::text, NULL::text, NULL::text;
    RETURN;
  END IF;

  nom_sg := t;

  -- Neuter in -μα (χρώμα → χρώματος / χρώματα)
  IF tl ~ 'μα$' AND n > 2 THEN
    stem := substring(t FROM 1 FOR n - 2);
    acc_sg := t;
    gen_sg := stem || 'ματος';
    nom_pl := stem || 'ματα';
    RETURN QUERY SELECT nom_sg, acc_sg, gen_sg, nom_pl;
    RETURN;
  END IF;

  -- Neuter in -ιο (σχολείο → σχολείου / σχολεία)
  IF tl ~ 'ιο$' AND n > 2 THEN
    stem := substring(t FROM 1 FOR n - 2);
    acc_sg := t;
    gen_sg := stem || 'ιου';
    nom_pl := stem || 'ια';
    RETURN QUERY SELECT nom_sg, acc_sg, gen_sg, nom_pl;
    RETURN;
  END IF;

  -- Neuter in -ι (σπίτι → σπιτιού / σπίτια), not -ιο / diphthongs
  IF tl ~ 'ι$' AND tl !~ 'ιο$' AND tl !~ 'αι$' AND tl !~ 'οι$' AND tl !~ 'μα$' AND n > 1 THEN
    stem := substring(t FROM 1 FOR n - 1);
    acc_sg := t;
    gen_sg := stem || 'ιου';
    nom_pl := stem || 'ια';
    RETURN QUERY SELECT nom_sg, acc_sg, gen_sg, nom_pl;
    RETURN;
  END IF;

  -- Neuter in -ο (βιβλίο already caught; short neuter e.g. το δώρο)
  IF tl ~ 'ο$' AND tl !~ 'ιο$' AND tl !~ 'μα$' AND n > 1 THEN
    stem := substring(t FROM 1 FOR n - 1);
    acc_sg := t;
    gen_sg := stem || 'ου';
    nom_pl := stem || 'α';
    RETURN QUERY SELECT nom_sg, acc_sg, gen_sg, nom_pl;
    RETURN;
  END IF;

  -- Feminine in -η (ζωή → ζωή / ζωής / ζωές; φίλη → φίλη / φίλης / φίλες)
  IF tl ~ 'η$' AND n > 1 THEN
    stem := substring(t FROM 1 FOR n - 1);
    acc_sg := stem || 'ή';
    gen_sg := stem || 'ής';
    nom_pl := stem || 'ές';
    RETURN QUERY SELECT nom_sg, acc_sg, gen_sg, nom_pl;
    RETURN;
  END IF;

  -- Feminine in -α (μέρα → μέρα / μέρας / μέρες; skip -μα handled above)
  IF tl ~ 'α$' AND tl !~ 'μα$' AND n > 1 THEN
    stem := substring(t FROM 1 FOR n - 1);
    acc_sg := stem || 'ά';
    gen_sg := stem || 'άς';
    nom_pl := stem || 'ές';
    RETURN QUERY SELECT nom_sg, acc_sg, gen_sg, nom_pl;
    RETURN;
  END IF;

  -- Masculine in -ης (μαθητής → μαθητή / μαθητή / μαθητές) — rough A2 template
  IF tl ~ 'ης$' AND n > 2 THEN
    stem := substring(t FROM 1 FOR n - 2);
    acc_sg := stem || 'ή';
    gen_sg := stem || 'ή';
    nom_pl := stem || 'ες';
    RETURN QUERY SELECT nom_sg, acc_sg, gen_sg, nom_pl;
    RETURN;
  END IF;

  -- Masculine in -ος (λόγος → λόγο / λόγου / λόγοι)
  IF tl ~ 'ος$' AND n > 2 THEN
    stem := substring(t FROM 1 FOR n - 2);
    acc_sg := stem || 'ο';
    gen_sg := stem || 'ου';
    nom_pl := stem || 'οι';
    RETURN QUERY SELECT nom_sg, acc_sg, gen_sg, nom_pl;
    RETURN;
  END IF;

  -- Masculine in -ας (πατέρας, μήνας, …) — too irregular for SQL; falls through to fallback.

  -- Fallback: show lemma in all cells (curate later in Sheets / SQL)
  acc_sg := t;
  gen_sg := t;
  nom_pl := t;
  RETURN QUERY SELECT nom_sg, acc_sg, gen_sg, nom_pl;
END;
$f$;

INSERT INTO public.noun_forms (vocab_id, nom_sg, acc_sg, gen_sg, nom_pl)
SELECT
  v.id,
  i.nom_sg,
  i.acc_sg,
  i.gen_sg,
  i.nom_pl
FROM public.vocab v
CROSS JOIN LATERAL public._noun_forms_infer(public._lemma_strip_article(v.greek)) AS i(nom_sg, acc_sg, gen_sg, nom_pl)
WHERE v.pos = 'noun'
  AND NOT EXISTS (SELECT 1 FROM public.noun_forms nf WHERE nf.vocab_id = v.id)
  AND i.nom_sg IS NOT NULL
ON CONFLICT (vocab_id) DO UPDATE SET
  nom_sg = EXCLUDED.nom_sg,
  acc_sg = EXCLUDED.acc_sg,
  gen_sg = EXCLUDED.gen_sg,
  nom_pl = EXCLUDED.nom_pl;

-- Optional: untagged rows you still treat as nouns (pos IS NULL) — uncomment if desired
-- INSERT INTO public.noun_forms (vocab_id, nom_sg, acc_sg, gen_sg, nom_pl)
-- SELECT v.id, i.nom_sg, i.acc_sg, i.gen_sg, i.nom_pl
-- FROM public.vocab v
-- CROSS JOIN LATERAL public._noun_forms_infer(public._lemma_strip_article(v.greek)) AS i(nom_sg, acc_sg, gen_sg, nom_pl)
-- WHERE v.pos IS NULL
--   AND NOT EXISTS (SELECT 1 FROM public.noun_forms nf WHERE nf.vocab_id = v.id)
--   AND i.nom_sg IS NOT NULL
-- ON CONFLICT (vocab_id) DO UPDATE SET
--   nom_sg = EXCLUDED.nom_sg, acc_sg = EXCLUDED.acc_sg, gen_sg = EXCLUDED.gen_sg, nom_pl = EXCLUDED.nom_pl;

COMMENT ON FUNCTION public._lemma_strip_article(text) IS 'Sprint 7 noun backfill helper — strip leading article for declension stem.';
COMMENT ON FUNCTION public._noun_forms_infer(text) IS 'Sprint 7 noun backfill — heuristic 4-case snapshot; irregulars need manual edit.';

REVOKE ALL ON FUNCTION public._lemma_strip_article(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public._noun_forms_infer(text) FROM PUBLIC;
