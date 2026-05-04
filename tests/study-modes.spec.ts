import { expect, test } from '@playwright/test'

function parseWordCountFromCard(text: string): number {
  const m = text.match(/(\d+)\s+слов/)
  return m ? Number(m[1]) : 0
}

test('mode tabs show flashcards, typing, and test UI', async ({ page }) => {
  await page.goto('/')

  const navCatalog = page.locator('nav').getByRole('button', { name: /Каталог/i })
  try {
    await navCatalog.waitFor({ state: 'visible', timeout: 120_000 })
  } catch {
    test.skip(true, 'App shell not ready — check VITE_SUPABASE_* and network for e2e')
  }

  const topicBtn = page.locator('button').filter({ hasText: /\d+\s+слов/ }).first()
  await expect(topicBtn).toBeVisible({ timeout: 120_000 })
  const topicLoc = page.locator('button').filter({ hasText: /\d+\s+слов/ })
  const labels = await topicLoc.allTextContents()
  const idx = labels.findIndex((t) => parseWordCountFromCard(t) >= 4)
  expect(idx >= 0, 'Need a catalog topic with at least 4 words for test mode').toBeTruthy()
  await topicLoc.nth(idx).click()

  await expect(page.getByText('нажмите, чтобы перевернуть')).toBeVisible()

  await page.getByRole('button', { name: 'Набор' }).click()
  await expect(page.getByPlaceholder('Введите греческое слово...')).toBeVisible()
  await expect(page.getByText('Напишите по-гречески')).toBeVisible()

  await page.getByRole('button', { name: 'Тест' }).click()
  await expect(page.getByText('Как по-гречески?')).toBeVisible()

  await page.getByRole('button', { name: 'Карточки' }).click()
  await expect(page.getByText('нажмите, чтобы перевернуть')).toBeVisible()
})
