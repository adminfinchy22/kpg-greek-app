export type RecordTrainingReview = (vocabIds: number[]) => Promise<void>

export async function completeTrainingReview(
  vocabIds: number[],
  recordTrainingReview: RecordTrainingReview,
  onSaved: () => void,
): Promise<void> {
  await recordTrainingReview(vocabIds)
  onSaved()
}
