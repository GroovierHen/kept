import { expect, type Page } from '@playwright/test'

export const TIME_ZONE = 'Asia/Karachi'
export const HYDRATION_CHECK_MS = 500

// A radio does nothing until the page has hydrated, so keep tapping until it takes.
export async function choose({ page, name }: { page: Page; name: string }) {
	const radio = page.getByRole('radio', { name })
	await expect(async () => {
		await radio.click()
		await expect(radio).toBeChecked({ timeout: HYDRATION_CHECK_MS })
	}).toPass()
}

async function answerGoalQuestion({
	page,
	question,
	answer
}: {
	page: Page
	question: string
	answer: string
}) {
	await page.getByRole('textbox', { name: question }).fill(answer)
	await page.getByRole('button', { name: 'Continue' }).click()
}

/** Sign-up to the Promise step, for a test about what comes after it. */
export async function walkToPromiseStep({ page, email }: { page: Page; email: string }) {
	await page.goto('/sign-up')
	await expect(page.locator('input[name="timeZone"]')).toHaveValue(TIME_ZONE)
	await page.getByLabel('Email').fill(email)
	await page.getByLabel('Password').fill('a-test-password')
	await page.getByRole('button', { name: 'Create account' }).click()
	await expect(page).toHaveURL(/\/setup$/)

	await answerGoalQuestion({
		page,
		question: 'What do you want to get better at?',
		answer: 'I want to run 5k without stopping.'
	})
	await choose({ page, name: '8 weeks' })
	await page.getByRole('button', { name: 'Continue' }).click()
	await answerGoalQuestion({ page, question: 'Where are you now?', answer: 'About 1 km.' })
	await answerGoalQuestion({
		page,
		question: 'What usually gets in your way?',
		answer: 'I am tired after work.'
	})

	await page.getByRole('button', { name: 'Make my plan' }).click()
	await page.getByRole('button', { name: 'Confirm my plan' }).click()

	// The first key idea of the plan the fake Gemini returns.
	await expect(page.getByRole('heading', { name: 'Run slow enough to talk' })).toBeVisible()
	await page.getByRole('button', { name: 'Continue' }).click()
}

/**
 * Passes today's learn card, if there is one. A plan has 5 ideas, and a day with
 * 2 recalls due teaches none, so a long run of days doesn't see one every day.
 */
export async function passLearnCard(page: Page) {
	const learned = page.getByRole('button', { name: 'Continue' })
	await expect(learned.or(page.getByRole('heading', { name: 'Your next promise' }))).toBeVisible()
	if (await learned.isVisible()) await learned.click()
}
