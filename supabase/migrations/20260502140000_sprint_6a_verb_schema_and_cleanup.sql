-- Sprint 6A — verb mode foundation (run in Supabase SQL Editor or via CLI)
-- 1) Columns on vocab: pos, semantic_group
-- 2) verb_forms table + RLS (read-only for anon/authenticated, like vocab)
-- 3) POS cleanup + duplicate merge + semantic_group backfill

-- ── vocab columns ───────────────────────────────────────────────────────────
ALTER TABLE vocab ADD COLUMN IF NOT EXISTS pos text;
ALTER TABLE vocab ADD COLUMN IF NOT EXISTS semantic_group text;

COMMENT ON COLUMN vocab.pos IS 'Part of speech: verb, adv, num, expression, …';
COMMENT ON COLUMN vocab.semantic_group IS 'Verb study filter: movement | cognition | daily_routine | communication | household';

-- ── verb_forms ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verb_forms (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  vocab_id bigint NOT NULL REFERENCES vocab (id) ON DELETE CASCADE,
  person text NOT NULL CHECK (person IN ('1sg', '2sg', '3sg', '1pl', '2pl', '3pl')),
  tense text NOT NULL DEFAULT 'present',
  form text NOT NULL,
  UNIQUE (vocab_id, person, tense)
);

CREATE INDEX IF NOT EXISTS idx_verb_forms_vocab_id ON verb_forms (vocab_id);

COMMENT ON TABLE verb_forms IS 'Present indicative (active/middle/passive as appropriate) for KPG verb lemmas in vocab.';

-- RLS (public read — align with your vocab/phrases policies)
ALTER TABLE verb_forms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "verb_forms_select_public" ON verb_forms;
CREATE POLICY "verb_forms_select_public"
  ON verb_forms FOR SELECT
  TO anon, authenticated
  USING (true);

-- ── False positives: not verbs ──────────────────────────────────────────────
UPDATE vocab SET pos = 'adv' WHERE greek IN ('εδώ', 'κάτω', 'πάνω', 'πίσω');
UPDATE vocab SET pos = 'num' WHERE greek IN ('οχτώ', 'όχτω', 'οκτώ', 'οκτώ');

-- Phrase-like / expression rows incorrectly tagged as verbs
UPDATE vocab SET pos = 'expression' WHERE greek IN (
  'Άλλη μια φορά παρακαλώ',
  'άλλη μια φορά παρακαλώ'
);
UPDATE vocab SET pos = 'expression' WHERE greek IN (
  'δεν νομίζω',
  'Δεν νομίζω'
);

-- ── Merge duplicate προτιμάω / προτιμώ (keep προτιμώ row when both exist) ──
DO $$
DECLARE
  id_keep bigint;
  id_drop bigint;
BEGIN
  SELECT v.id INTO id_keep
  FROM vocab v
  WHERE v.greek IN ('προτιμώ', 'προτιμάω')
  ORDER BY CASE WHEN v.greek = 'προτιμώ' THEN 0 ELSE 1 END, v.id
  LIMIT 1;

  IF id_keep IS NULL THEN
    RETURN;
  END IF;

  SELECT v.id INTO id_drop
  FROM vocab v
  WHERE v.greek IN ('προτιμώ', 'προτιμάω') AND v.id <> id_keep
  ORDER BY v.id
  LIMIT 1;

  IF id_keep IS NOT NULL AND id_drop IS NOT NULL THEN
    -- Preserve “known” if either row was marked known (single global progress row per vocab_id)
    UPDATE user_progress u
    SET known = true
    WHERE u.vocab_id = id_keep
      AND EXISTS (SELECT 1 FROM user_progress d WHERE d.vocab_id = id_drop AND d.known = true);

    DELETE FROM user_progress WHERE vocab_id = id_drop;
    DELETE FROM vocab WHERE id = id_drop;
  END IF;
END $$;

-- Unify spelling to demotic 1sg where the older form still exists alone
UPDATE vocab SET greek = 'προτιμώ', pos = 'verb' WHERE greek = 'προτιμάω';

-- ── Semantic groups (only rows still marked as verbs) ───────────────────────
UPDATE vocab SET semantic_group = 'movement' WHERE pos = 'verb' AND greek IN (
  'πάω', 'πηγαίνω', 'έρχομαι', 'επιστρέφω', 'λείπω'
);

UPDATE vocab SET semantic_group = 'cognition' WHERE pos = 'verb' AND greek IN (
  'νομίζω', 'σκέφτομαι', 'καταλαβαίνω', 'ξέρω', 'θέλω', 'μπορώ', 'βρίσκω',
  'χάνω', 'μαθαίνω', 'νιώθω', 'ελπίζω', 'φοβάμαι', 'ξεχνάω', 'θυμάμαι',
  'αγαπώ', 'προτιμώ', 'βλέπω', 'ακούω', 'πιστεύω', 'προσπαθώ', 'θυμώνω'
);

UPDATE vocab SET semantic_group = 'daily_routine' WHERE pos = 'verb' AND greek IN (
  'είμαι', 'κάνω', 'μένω', 'δουλεύω', 'σπουδάζω', 'τρώω', 'πίνω', 'ζω', 'ξυπνάω',
  'κοιμάμαι', 'σηκώνομαι', 'ντύνομαι', 'περιμένω', 'αρχίζω', 'τελειώνω',
  'εργάζομαι', 'πληρώνω', 'αγοράζω', 'παίρνω', 'ψωνίζω', 'κουράζομαι'
);

UPDATE vocab SET semantic_group = 'communication' WHERE pos = 'verb' AND greek IN (
  'λέω', 'μιλάω', 'δίνω', 'δείχνω', 'συναντάω', 'τηλεφωνώ', 'χαιρετάω',
  'ευχαριστώ', 'συμφωνώ', 'διαφωνώ', 'παρακαλώ', 'στέλνω', 'φέρνω',
  'συζητάω', 'χαίρομαι', 'λυπάμαι'
);

UPDATE vocab SET semantic_group = 'household' WHERE pos = 'verb' AND greek IN (
  'έχω', 'ανοίγω', 'κλείνω', 'καθαρίζω', 'μαγειρεύω', 'πλένω', 'χρησιμοποιώ',
  'χρειάζομαι', 'πουλάω', 'γράφω', 'διαβάζω', 'διδάσκω', 'βοηθάω'
);

-- Catch-all for verbs not in the lists above (still usable, filter as “all”)
UPDATE vocab SET semantic_group = 'daily_routine' WHERE pos = 'verb' AND semantic_group IS NULL;

-- Optional: mirror semantic_group into notes for quick human scan (skip if already tagged)
UPDATE vocab v
SET notes = concat_ws(E'\n', nullif(trim(both E' \t\n' FROM v.notes), ''), '[semantic:' || v.semantic_group || ']')
WHERE v.pos = 'verb'
  AND v.semantic_group IS NOT NULL
  AND (
    v.notes IS NULL
    OR trim(both E' \t\n' FROM v.notes) = ''
    OR v.notes NOT LIKE '%[semantic:' || v.semantic_group || ']%'
  );
