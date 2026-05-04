-- Sprint 7A — catalog, examples, noun forms, word_status, user_progress.due_at
-- FKs use bigint to match vocab.id / verb_forms style.

-- ── user_progress: spaced / training due date ───────────────────────────────
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS due_at timestamptz;

COMMENT ON COLUMN public.user_progress.due_at IS 'Next review due (training / SRS); null = not scheduled';

-- ── vocab: CEFR level ───────────────────────────────────────────────────────
ALTER TABLE public.vocab
  ADD COLUMN IF NOT EXISTS level text DEFAULT 'A2';

COMMENT ON COLUMN public.vocab.level IS 'CEFR tag: A1 | A2 | B1';

UPDATE public.vocab SET level = 'A2' WHERE level IS NULL;

-- ── topics: catalog card chrome ─────────────────────────────────────────────
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS icon text;

ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS color text;

UPDATE public.topics SET icon = '👤', color = '#FAEEDA' WHERE id = 1;
UPDATE public.topics SET icon = '🏠', color = '#E6F1FB' WHERE id = 2;
UPDATE public.topics SET icon = '🍽️', color = '#EAF3DE' WHERE id = 3;
UPDATE public.topics SET icon = '🛍️', color = '#EEEDFE' WHERE id = 4;
UPDATE public.topics SET icon = '⏰', color = '#FAECE7' WHERE id = 5;
UPDATE public.topics SET icon = '🚌', color = '#E6F1FB' WHERE id = 6;
UPDATE public.topics SET icon = '🏥', color = '#FCEBEB' WHERE id = 7;
UPDATE public.topics SET icon = '📚', color = '#EAF3DE' WHERE id = 8;
UPDATE public.topics SET icon = '💼', color = '#FAEEDA' WHERE id = 9;
UPDATE public.topics SET icon = '🎯', color = '#EEEDFE' WHERE id = 10;
UPDATE public.topics SET icon = '⛅', color = '#E6F1FB' WHERE id = 11;
UPDATE public.topics SET icon = '🏙️', color = '#EAF3DE' WHERE id = 12;
UPDATE public.topics SET icon = '🔤', color = '#FAECE7' WHERE id = 13;
UPDATE public.topics SET icon = '🔢', color = '#FAEEDA' WHERE id = 14;
UPDATE public.topics SET icon = '⚡', color = '#EEEDFE' WHERE id = 15;

-- ── noun_forms (4 cases A2) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.noun_forms (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vocab_id bigint NOT NULL REFERENCES public.vocab (id) ON DELETE CASCADE,
  nom_sg text,
  acc_sg text,
  gen_sg text,
  nom_pl text,
  UNIQUE (vocab_id)
);

CREATE INDEX IF NOT EXISTS idx_noun_forms_vocab_id ON public.noun_forms (vocab_id);

COMMENT ON TABLE public.noun_forms IS 'Declension snapshot: nom.sg / acc.sg / gen.sg / nom.pl (A2 KPG).';

ALTER TABLE public.noun_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "noun_forms_select_public" ON public.noun_forms;
CREATE POLICY "noun_forms_select_public"
  ON public.noun_forms FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── word_examples (verbs + nouns) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.word_examples (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vocab_id bigint NOT NULL REFERENCES public.vocab (id) ON DELETE CASCADE,
  sentence_el text NOT NULL,
  sentence_ru text NOT NULL,
  tense text NOT NULL DEFAULT 'general'
    CHECK (tense IN ('present', 'future', 'aorist', 'general')),
  sort_order int NOT NULL DEFAULT 1,
  UNIQUE (vocab_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_word_examples_vocab_id ON public.word_examples (vocab_id);

COMMENT ON TABLE public.word_examples IS 'Up to N example sentences per vocab row.';

ALTER TABLE public.word_examples ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "word_examples_select_public" ON public.word_examples;
CREATE POLICY "word_examples_select_public"
  ON public.word_examples FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── word_status view (PostgREST) ─────────────────────────────────────────────
CREATE OR REPLACE VIEW public.word_status AS
SELECT
  v.id AS vocab_id,
  v.greek,
  v.russian,
  v.topic_id,
  v.pos,
  CASE
    WHEN up.known = true THEN 'learned'
    WHEN up.due_at IS NOT NULL AND up.due_at <= now() THEN 'due'
    WHEN up.id IS NOT NULL THEN 'studying'
    ELSE 'new'
  END AS status,
  up.due_at,
  up.review_count,
  up.known
FROM public.vocab v
LEFT JOIN public.user_progress up ON up.vocab_id = v.id;

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries.';
