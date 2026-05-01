import { expect, test } from '@playwright/test'

function parseTrailingCount(label: string): number {
  const m = label.match(/\((\d+)\)\s*$/)
  return m ? Number(m[1]) : 0
}

test('mode tabs show flashcards, typing, and test UI', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('нажмите, чтобы перевернуть')).toBeVisible()

  await page.getByRole('button', { name: 'Набор' }).click()
  await expect(page.getByPlaceholder('Введите греческое слово...')).toBeVisible()
  await expect(page.getByText('Напишите по-гречески')).toBeVisible()

  await page.getByRole('button', { name: 'Тест' }).click()
  const pickTopicHint = page.getByText(/как минимум 4 словами/)
  if (await pickTopicHint.isVisible()) {
    const topicLabels = await page
      .getByRole('button')
      .filter({ hasText: /\(\d+\)\s*$/ })
      .filter({ hasNotText: /^Все\s*\(/ })
      .allTextContents()
    const enough = topicLabels.find((label) => parseTrailingCount(label) >= 4)
    expect(enough, 'Need a topic with at least 4 words for test mode').toBeTruthy()
    await page.getByRole('button', { name: enough! }).click()
  }

  await expect(page.getByText('Как по-гречески?')).toBeVisible()

  await page.getByRole('button', { name: 'Карточки' }).click()
  await expect(page.getByText('нажмите, чтобы перевернуть')).toBeVisible()
})
