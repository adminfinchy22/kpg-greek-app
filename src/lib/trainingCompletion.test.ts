import { describe, expect, it } from 'vitest'
import { completeTrainingSession } from './trainingCompletion'

describe('completeTrainingSession', () => {
  it('waits for async completion before reporting success', async () => {
    let resolveSave: (() => void) | undefined
    let settled = false

    const resultPromise = completeTrainingSession([1, 2], () => new Promise<void>((resolve) => {
      resolveSave = resolve
    }))
    resultPromise.then(() => {
      settled = true
    })

    await Promise.resolve()
    expect(settled).toBe(false)

    resolveSave?.()
    await expect(resultPromise).resolves.toEqual({ ok: true })
  })

  it('returns a retryable error when completion fails', async () => {
    await expect(completeTrainingSession([3], async () => {
      throw new Error('insert failed')
    })).resolves.toEqual({ ok: false, error: 'insert failed' })
  })
})
