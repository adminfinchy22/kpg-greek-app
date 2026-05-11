-- Ensure existing Sprint 7A deployments make word_status obey underlying table RLS.
-- The original view exposes user_progress-derived fields, so it must not run
-- with the view owner's privileges through PostgREST.

DO $$
BEGIN
  IF to_regclass('public.word_status') IS NOT NULL THEN
    EXECUTE 'ALTER VIEW public.word_status SET (security_invoker = true)';
  END IF;
END $$;
