const FALLBACK_SAVE_ERROR = 'Не удалось сохранить прогресс. Попробуйте ещё раз.'

export type TrainingCompletionResult =
  | { ok: true }
  | { ok: false; error: string }

export async function completeTrainingSession(
  vocabIds: number[],
  onComplete: (vocabIds: number[]) => void | Promise<void>,
): Promise<TrainingCompletionResult> {
  try {
    await onComplete(vocabIds)
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error && error.message ? error.message : FALLBACK_SAVE_ERROR,
    }
  }
}
