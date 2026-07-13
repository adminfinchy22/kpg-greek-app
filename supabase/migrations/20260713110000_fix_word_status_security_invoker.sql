-- Ensure word_status queries run with the caller's RLS permissions.
ALTER VIEW public.word_status SET (security_invoker = true);

GRANT SELECT ON public.word_status TO anon, authenticated;

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries; security_invoker keeps user_progress RLS enforced.';
