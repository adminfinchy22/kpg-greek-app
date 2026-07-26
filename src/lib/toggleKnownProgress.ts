/**
 * Next persisted fields after toggling the flashcard/verb "known" control.
 * Demoting a learned word must re-enter the due queue (word_status only marks
 * unknown rows as due when due_at <= now()). Promoting clears the schedule.
 */
export function buildToggleKnownUpdate(
  wasKnown: boolean,
  reviewCount: number | null | undefined,
  nowIso: string,
): {
  known: boolean
  last_reviewed: string
  review_count: number
  due_at: string | null
} {
  const nextKnown = !wasKnown
  return {
    known: nextKnown,
    last_reviewed: nowIso,
    review_count: (reviewCount ?? 0) + 1,
    due_at: nextKnown ? null : nowIso,
  }
}
