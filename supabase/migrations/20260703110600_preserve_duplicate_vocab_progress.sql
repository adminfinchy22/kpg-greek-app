DO $$
DECLARE
  id_keep bigint;
  id_drop bigint;
BEGIN
  SELECT v.id INTO id_keep
  FROM vocab v
  WHERE v.greek IN ('προτιμώ', 'προτιμάω')
  ORDER BY CASE WHEN v.greek = 'προτιμώ' THEN 0 ELSE 1 END, v.id
  LIMIT 1;

  IF id_keep IS NULL THEN
    RETURN;
  END IF;

  SELECT v.id INTO id_drop
  FROM vocab v
  WHERE v.greek IN ('προτιμώ', 'προτιμάω') AND v.id <> id_keep
  ORDER BY v.id
  LIMIT 1;

  IF id_keep IS NOT NULL AND id_drop IS NOT NULL THEN
    UPDATE user_progress u
    SET vocab_id = id_keep
    WHERE u.vocab_id = id_drop
      AND NOT EXISTS (SELECT 1 FROM user_progress k WHERE k.vocab_id = id_keep);

    UPDATE user_progress k
    SET
      known = COALESCE(k.known, false) OR COALESCE(d.known, false),
      review_count = GREATEST(COALESCE(k.review_count, 0), COALESCE(d.review_count, 0)),
      last_reviewed = CASE
        WHEN k.last_reviewed IS NULL THEN d.last_reviewed
        WHEN d.last_reviewed IS NULL THEN k.last_reviewed
        ELSE GREATEST(k.last_reviewed, d.last_reviewed)
      END
    FROM user_progress d
    WHERE k.vocab_id = id_keep
      AND d.vocab_id = id_drop;

    DELETE FROM user_progress WHERE vocab_id = id_drop;
    DELETE FROM vocab WHERE id = id_drop;
  END IF;
END $$;

UPDATE vocab SET greek = 'προτιμώ', pos = 'verb' WHERE greek = 'προτιμάω';
