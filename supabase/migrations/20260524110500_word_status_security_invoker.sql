-- Ensure the public status view cannot bypass RLS on user_progress.
-- Supabase/Postgres views default to security definer semantics; security_invoker
-- makes the underlying table policies run as the anon/authenticated caller.
ALTER VIEW public.word_status
  SET (security_invoker = true);

COMMENT ON VIEW public.word_status IS
  'Derived study status per vocab row for catalog / due queries; security_invoker preserves underlying RLS.';
