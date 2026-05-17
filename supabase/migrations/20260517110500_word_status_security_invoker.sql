-- Ensure browser queries through word_status honor RLS on joined tables.
ALTER VIEW public.word_status SET (security_invoker = true);

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries; runs as invoker so underlying RLS policies apply.';
