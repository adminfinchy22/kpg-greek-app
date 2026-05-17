-- Preserve the app invariant used by progress writes and word_status: one row per vocab item.
-- Concurrent read-then-insert writes could otherwise create duplicate progress rows.

WITH merged AS (
  SELECT
    vocab_id,
    min(id) AS keep_id,
    bool_or(coalesce(known, false)) AS known,
    max(last_reviewed) AS last_reviewed,
    least(coalesce(sum(coalesce(review_count, 0)), 0), 2147483647)::int AS review_count,
    min(due_at) FILTER (WHERE due_at IS NOT NULL) AS due_at
  FROM public.user_progress
  GROUP BY vocab_id
  HAVING count(*) > 1
),
updated AS (
  UPDATE public.user_progress up
  SET
    known = m.known,
    last_reviewed = m.last_reviewed,
    review_count = m.review_count,
    due_at = CASE WHEN m.known THEN NULL ELSE m.due_at END
  FROM merged m
  WHERE up.id = m.keep_id
  RETURNING up.id
)
DELETE FROM public.user_progress up
USING merged m
WHERE up.vocab_id = m.vocab_id
  AND up.id <> m.keep_id;

CREATE UNIQUE INDEX IF NOT EXISTS user_progress_vocab_id_key
  ON public.user_progress (vocab_id);
