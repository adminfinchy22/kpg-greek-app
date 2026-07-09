-- Critical fixes for Sprint 6A/7A:
-- 1) Preserve duplicate vocab progress before deleting the alias row.
-- 2) Ensure word_status is evaluated with the caller's RLS policies.

DO $$
DECLARE
  id_keep bigint;
  id_drop bigint;
BEGIN
  SELECT v.id INTO id_keep
  FROM public.vocab v
  WHERE v.greek IN ('προτιμώ', 'προτιμάω')
  ORDER BY CASE WHEN v.greek = 'προτιμώ' THEN 0 ELSE 1 END, v.id
  LIMIT 1;

  IF id_keep IS NULL THEN
    RETURN;
  END IF;

  SELECT v.id INTO id_drop
  FROM public.vocab v
  WHERE v.greek IN ('προτιμώ', 'προτιμάω') AND v.id <> id_keep
  ORDER BY v.id
  LIMIT 1;

  IF id_drop IS NOT NULL THEN
    WITH merged AS (
      SELECT
        bool_or(COALESCE(known, false)) AS known,
        MIN(due_at) FILTER (WHERE due_at IS NOT NULL) AS due_at,
        MAX(COALESCE(review_count, 0)) AS review_count,
        MAX(last_reviewed) AS last_reviewed
      FROM public.user_progress
      WHERE vocab_id IN (id_keep, id_drop)
    ),
    updated AS (
      UPDATE public.user_progress u
      SET
        known = COALESCE(u.known, false) OR merged.known,
        due_at = CASE
          WHEN COALESCE(u.known, false) OR merged.known THEN NULL
          ELSE COALESCE(LEAST(u.due_at, merged.due_at), u.due_at, merged.due_at)
        END,
        review_count = GREATEST(COALESCE(u.review_count, 0), merged.review_count),
        last_reviewed = GREATEST(
          COALESCE(u.last_reviewed, merged.last_reviewed),
          COALESCE(merged.last_reviewed, u.last_reviewed)
        )
      FROM merged
      WHERE u.vocab_id = id_keep
        AND (
          merged.known = true
          OR merged.due_at IS NOT NULL
          OR merged.review_count > 0
          OR merged.last_reviewed IS NOT NULL
        )
      RETURNING u.id
    )
    INSERT INTO public.user_progress (vocab_id, known, due_at, review_count, last_reviewed)
    SELECT
      id_keep,
      merged.known,
      CASE WHEN merged.known THEN NULL ELSE merged.due_at END,
      merged.review_count,
      merged.last_reviewed
    FROM merged
    WHERE NOT EXISTS (SELECT 1 FROM updated)
      AND (
        merged.known = true
        OR merged.due_at IS NOT NULL
        OR merged.review_count > 0
        OR merged.last_reviewed IS NOT NULL
      );

    DELETE FROM public.user_progress WHERE vocab_id = id_drop;
    DELETE FROM public.vocab WHERE id = id_drop;
  END IF;
END $$;

CREATE OR REPLACE VIEW public.word_status WITH (security_invoker = true) AS
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

GRANT SELECT ON public.word_status TO anon, authenticated;
