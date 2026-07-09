type MaybePromise<T> = T | Promise<T>

export async function completeTrainingReview(
  vocabIds: number[],
  recordTrainingReview: (vocabIds: number[]) => MaybePromise<void>,
  refetchProgress?: () => MaybePromise<void>,
): Promise<void> {
  await recordTrainingReview(vocabIds)
  await refetchProgress?.()
}
