export const TRAINING_SAVE_ERROR =
  'Не удалось сохранить прогресс. Проверьте подключение и попробуйте снова.'

export async function saveTrainingProgress(
  onComplete: (vocabIds: number[]) => void | Promise<void>,
  vocabIds: number[],
): Promise<string | null> {
  try {
    await onComplete(vocabIds)
    return null
  } catch {
    return TRAINING_SAVE_ERROR
  }
}
