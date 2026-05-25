-- Ensure word_status respects caller RLS on user_progress.
CREATE OR REPLACE VIEW public.word_status
WITH (security_invoker = true) AS
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

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries. Runs as security_invoker so user_progress RLS is enforced.';
