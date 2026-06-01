-- Ensure PostgREST queries through word_status obey RLS on underlying tables.
-- Views created by privileged roles otherwise evaluate underlying table access as
-- the view owner, which can expose user_progress rows across callers.
ALTER VIEW IF EXISTS public.word_status SET (security_invoker = true);
