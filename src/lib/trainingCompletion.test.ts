import { describe, expect, it, vi } from 'vitest'
import { completeTrainingReview } from './trainingCompletion'

describe('completeTrainingReview', () => {
  it('saves the completed vocab ids before silently refreshing progress', async () => {
    const calls: string[] = []
    const saveTrainingReview = vi.fn(async (ids: number[]) => {
      calls.push(`save:${ids.join(',')}`)
    })
    const refetchProgress = vi.fn(async (options?: { silent?: boolean }) => {
      calls.push(`refetch:${String(options?.silent)}`)
    })

    await completeTrainingReview([1, 2, 3], saveTrainingReview, refetchProgress)

    expect(saveTrainingReview).toHaveBeenCalledWith([1, 2, 3])
    expect(refetchProgress).toHaveBeenCalledWith({ silent: true })
    expect(calls).toEqual(['save:1,2,3', 'refetch:true'])
  })

  it('propagates save failures without refreshing progress', async () => {
    const error = new Error('write failed')
    const saveTrainingReview = vi.fn(async () => {
      throw error
    })
    const refetchProgress = vi.fn()

    await expect(completeTrainingReview([5], saveTrainingReview, refetchProgress)).rejects.toThrow('write failed')
    expect(refetchProgress).not.toHaveBeenCalled()
  })
})
