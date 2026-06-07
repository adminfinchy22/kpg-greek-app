-- Ensure the catalog status view respects caller RLS policies on user_progress.
ALTER VIEW public.word_status SET (security_invoker = true);
