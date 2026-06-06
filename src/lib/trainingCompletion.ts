export type TrainingCompleteHandler = (vocabIds: number[]) => void | Promise<void>

export async function completeTrainingResult(
  vocabIds: number[],
  onComplete: TrainingCompleteHandler,
  onClose: () => void,
) {
  await onComplete(vocabIds)
  onClose()
}
