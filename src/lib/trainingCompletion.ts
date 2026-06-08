export async function completeTrainingSession(
  vocabIds: number[],
  persistReview: (vocabIds: number[]) => void | Promise<void>,
  closeSession: () => void,
) {
  await persistReview(vocabIds)
  closeSession()
}
