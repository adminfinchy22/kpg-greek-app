-- Ensure the catalog status view respects caller RLS on user_progress.
ALTER VIEW public.word_status SET (security_invoker = true);
GRANT SELECT ON public.word_status TO anon, authenticated;
