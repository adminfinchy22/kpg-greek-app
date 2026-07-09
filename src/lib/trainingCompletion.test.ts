import { describe, expect, it, vi } from 'vitest'
import { completeTrainingReview } from './trainingCompletion'

describe('completeTrainingReview', () => {
  it('waits for the training save before refetching progress', async () => {
    const calls: string[] = []
    const recordTrainingReview = vi.fn(async (ids: number[]) => {
      expect(ids).toEqual([1, 2, 3])
      calls.push('record')
    })
    const refetchProgress = vi.fn(async () => {
      calls.push('refetch')
    })

    await completeTrainingReview([1, 2, 3], recordTrainingReview, refetchProgress)

    expect(calls).toEqual(['record', 'refetch'])
  })

  it('propagates save failures so the results screen can retry', async () => {
    const error = new Error('permission denied')
    const recordTrainingReview = vi.fn(async () => {
      throw error
    })
    const refetchProgress = vi.fn()

    await expect(completeTrainingReview([7], recordTrainingReview, refetchProgress)).rejects.toBe(error)
    expect(refetchProgress).not.toHaveBeenCalled()
  })
})
