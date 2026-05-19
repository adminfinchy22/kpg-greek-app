-- Ensure word_status does not bypass user_progress RLS when exposed via PostgREST.
ALTER VIEW public.word_status SET (security_invoker = true);

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries. Runs with caller RLS.';
