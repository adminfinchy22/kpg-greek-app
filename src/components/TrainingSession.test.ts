import { describe, expect, it, vi } from 'vitest'
import { completeTrainingResult } from '../lib/trainingCompletion'

describe('completeTrainingResult', () => {
  it('waits for persistence before closing', async () => {
    const onComplete = vi.fn(async () => {
      await Promise.resolve()
    })
    const onClose = vi.fn()

    await completeTrainingResult([1, 2], onComplete, onClose)

    expect(onComplete).toHaveBeenCalledWith([1, 2])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close when persistence fails', async () => {
    const onComplete = vi.fn(async () => {
      throw new Error('network down')
    })
    const onClose = vi.fn()

    await expect(completeTrainingResult([3], onComplete, onClose)).rejects.toThrow('network down')

    expect(onClose).not.toHaveBeenCalled()
  })
})
