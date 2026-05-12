-- Ensure word_status respects RLS policies on underlying tables.
-- By default, Postgres views run with owner privileges and can bypass user_progress RLS.

ALTER VIEW public.word_status SET (security_invoker = true);
