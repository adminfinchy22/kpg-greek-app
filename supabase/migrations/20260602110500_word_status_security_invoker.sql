-- Ensure PostgREST queries to word_status respect RLS on joined progress rows.
ALTER VIEW public.word_status SET (security_invoker = true);

COMMENT ON VIEW public.word_status IS
  'Derived study status per vocab row for catalog / due queries; invokes underlying table RLS.';
