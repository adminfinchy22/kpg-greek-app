-- Ensure PostgREST queries of word_status enforce RLS on underlying tables.
ALTER VIEW public.word_status
  SET (security_invoker = true);
