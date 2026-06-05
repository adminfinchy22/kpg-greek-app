-- Ensure the public PostgREST view honors RLS on user_progress.
ALTER VIEW public.word_status SET (security_invoker = true);

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries. security_invoker ensures underlying RLS is applied.';
