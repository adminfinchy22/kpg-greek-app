-- Ensure word_status evaluates user_progress RLS as the API caller.
ALTER VIEW public.word_status SET (security_invoker = true);

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries; security_invoker preserves user_progress RLS.';
