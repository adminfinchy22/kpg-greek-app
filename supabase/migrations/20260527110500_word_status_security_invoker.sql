-- Ensure the catalog status view observes RLS policies on user_progress.
ALTER VIEW public.word_status SET (security_invoker = true);

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries. Runs as security_invoker so user_progress RLS is enforced.';
