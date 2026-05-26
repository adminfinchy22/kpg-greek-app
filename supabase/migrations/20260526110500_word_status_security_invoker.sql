-- Ensure the catalog status view respects RLS on user_progress.
ALTER VIEW public.word_status SET (security_invoker = true);
