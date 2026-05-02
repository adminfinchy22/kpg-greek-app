-- Sprint 6A repair — run this ONLY if backfill failed with:
--   column "person" of relation "verb_forms" does not exist
--
-- Cause: `verb_forms` existed before sprint 6A with a different shape, so
-- `CREATE TABLE IF NOT EXISTS` in the first migration did nothing.
--
-- Then re-run: 20260502140001_sprint_6a_verb_forms_backfill.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'verb_forms'
      AND c.column_name = 'person'
  ) THEN
    DROP TABLE IF EXISTS public.verb_forms CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.verb_forms (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vocab_id bigint NOT NULL REFERENCES public.vocab (id) ON DELETE CASCADE,
  person text NOT NULL CHECK (person IN ('1sg', '2sg', '3sg', '1pl', '2pl', '3pl')),
  tense text NOT NULL DEFAULT 'present',
  form text NOT NULL,
  UNIQUE (vocab_id, person, tense)
);

CREATE INDEX IF NOT EXISTS idx_verb_forms_vocab_id ON public.verb_forms (vocab_id);

COMMENT ON TABLE public.verb_forms IS 'Present indicative (active/middle/passive as appropriate) for KPG verb lemmas in vocab.';

ALTER TABLE public.verb_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verb_forms_select_public" ON public.verb_forms;
CREATE POLICY "verb_forms_select_public"
  ON public.verb_forms FOR SELECT
  TO anon, authenticated
  USING (true);
