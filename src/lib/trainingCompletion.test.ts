import { describe, expect, it, vi } from 'vitest'
import { completeTrainingSession } from './trainingCompletion'

describe('completeTrainingSession', () => {
  it('persists review data before closing the session', async () => {
    const events: string[] = []
    const persistReview = vi.fn(async () => {
      events.push('persisted')
    })
    const closeSession = vi.fn(() => {
      events.push('closed')
    })

    await completeTrainingSession([1, 2, 3], persistReview, closeSession)

    expect(persistReview).toHaveBeenCalledWith([1, 2, 3])
    expect(closeSession).toHaveBeenCalledOnce()
    expect(events).toEqual(['persisted', 'closed'])
  })

  it('does not close the session when persisting review data fails', async () => {
    const closeSession = vi.fn()

    await expect(
      completeTrainingSession(
        [1],
        async () => {
          throw new Error('save failed')
        },
        closeSession,
      ),
    ).rejects.toThrow('save failed')

    expect(closeSession).not.toHaveBeenCalled()
  })
})
