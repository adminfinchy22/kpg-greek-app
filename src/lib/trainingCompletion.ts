type SaveTrainingReview = (vocabIds: number[]) => Promise<void>
type RefetchProgress = (options?: { silent?: boolean }) => Promise<void> | void

export async function completeTrainingReview(
  vocabIds: number[],
  saveTrainingReview: SaveTrainingReview,
  refetchProgress: RefetchProgress,
) {
  await saveTrainingReview(vocabIds)
  await refetchProgress({ silent: true })
}
