-- Ensure the public word_status view evaluates underlying table RLS policies
-- as the querying role instead of the view owner.
ALTER VIEW public.word_status SET (security_invoker = true);

COMMENT ON VIEW public.word_status IS 'Derived study status per vocab row for catalog / due queries; security_invoker keeps user_progress RLS enforced.';
