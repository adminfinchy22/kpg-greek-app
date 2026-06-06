-- Ensure the PostgREST-facing status view does not bypass RLS on user_progress.
ALTER VIEW public.word_status SET (security_invoker = true);
