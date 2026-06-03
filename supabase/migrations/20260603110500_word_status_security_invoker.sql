-- Ensure PostgREST reads of word_status enforce user_progress RLS.
ALTER VIEW public.word_status SET (security_invoker = true);

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries; runs as invoker so user_progress RLS is enforced.';
