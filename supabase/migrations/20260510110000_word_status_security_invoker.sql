-- Ensure the catalog status view obeys RLS on user_progress.
-- Supabase/Postgres views are security-definer by default unless this is set.
ALTER VIEW public.word_status SET (security_invoker = true);
