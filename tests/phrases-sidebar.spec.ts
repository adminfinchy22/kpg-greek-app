import { expect, test } from '@playwright/test'

const PHRASE_COUNT_REGEX = /·\s*(\d+)\s+шаблонов/

function parseCountFromLabel(label: string): number {
  const match = label.match(/\((\d+)\)/)
  if (!match) throw new Error(`Cannot parse count from label: ${label}`)
  return Number(match[1])
}

test('switches phrase list when choosing categories', async ({ page }) => {
  await page.goto('/')

  const navCatalog = page.locator('nav').getByRole('button', { name: /Каталог/i })
  try {
    await navCatalog.waitFor({ state: 'visible', timeout: 120_000 })
  } catch {
    test.skip(true, 'App shell not ready — check VITE_SUPABASE_* and network for e2e')
  }

  const phrasesTab = page.locator('nav').getByRole('button', { name: /Фразы/i })
  await expect(phrasesTab).toBeVisible({ timeout: 120_000 })
  await phrasesTab.click()

  const allHeader = page.getByText(PHRASE_COUNT_REGEX)
  await expect(allHeader).toBeVisible()
  const allHeaderText = await allHeader.textContent()
  const allHeaderCount = Number(allHeaderText?.match(PHRASE_COUNT_REGEX)?.[1] ?? -1)
  expect(allHeaderCount).toBeGreaterThanOrEqual(0)

  const categoryButtons = page
    .getByRole('button')
    .filter({ hasText: /^[^()]+\(\d+\)$/ })
    .filter({ hasNotText: /^Все\s*\(/ })
  const labels = await categoryButtons.allTextContents()
  const nonZero = labels.find((label) => parseCountFromLabel(label) > 0)
  expect(nonZero, 'Need at least one non-zero phrase category').toBeTruthy()

  const nonZeroCount = parseCountFromLabel(nonZero!)
  await page.getByRole('button', { name: nonZero! }).click()
  await expect(page.getByText(new RegExp(`·\\s*${nonZeroCount}\\s+шаблонов`))).toBeVisible()

  const zero = labels.find((label) => parseCountFromLabel(label) === 0)
  if (zero) {
    await page.getByRole('button', { name: zero }).click()
    await expect(page.getByText(/·\s*0\s+шаблонов/)).toBeVisible()
  }

  await page.getByRole('button', { name: /Все \(\d+\)/ }).click()
  await expect(page.getByText(new RegExp(`·\\s*${allHeaderCount}\\s+шаблонов`))).toBeVisible()
})
