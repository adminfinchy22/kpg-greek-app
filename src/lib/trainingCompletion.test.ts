import { describe, expect, it, vi } from 'vitest'
import { completeTrainingReview } from './trainingCompletion'

describe('completeTrainingReview', () => {
  it('refreshes status only after training progress is saved', async () => {
    const calls: string[] = []
    const recordTrainingReview = vi.fn(async () => {
      calls.push('save')
    })
    const onSaved = vi.fn(() => {
      calls.push('refresh')
    })

    await completeTrainingReview([1, 2, 3], recordTrainingReview, onSaved)

    expect(recordTrainingReview).toHaveBeenCalledWith([1, 2, 3])
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(calls).toEqual(['save', 'refresh'])
  })

  it('propagates save failures so the modal can stay open for retry', async () => {
    const err = new Error('network down')
    const recordTrainingReview = vi.fn(async () => {
      throw err
    })
    const onSaved = vi.fn()

    await expect(completeTrainingReview([1], recordTrainingReview, onSaved)).rejects.toThrow('network down')
    expect(onSaved).not.toHaveBeenCalled()
  })
})
