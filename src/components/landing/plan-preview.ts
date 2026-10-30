// The home page's "type a goal" demo: reads a goal written the way people say
// it ("£20,000 in 5 years") and splits it the way setup does, into a year, a
// month, a week and a day, plus what monthly saving grows to at an example
// rate. Landing-page only: the real split belongs to Learn's goal planner, and
// this should read from it once that lands.

const MONTHS_PER_YEAR = 12
const WEEKS_PER_YEAR = 52
const DAYS_PER_YEAR = 365
const MAX_MONTHS = 600
/** The example rate the compound growth lesson uses, and says it uses. */
export const EXAMPLE_ANNUAL_RATE = 0.04
/** Monthly targets at or above this are rounded up to the next £5, as in the walkthrough (£333.33 → £335). */
const ROUND_TO_FIVE_FROM = 50

export interface Goal {
	readonly amount: number
	readonly months: number
}

export interface PlanSplit {
	readonly year: number
	readonly month: number
	readonly week: number
	readonly day: number
	/** What saving `month` every month for the whole span grows to at the example rate, or null under a year. */
	readonly grown: { readonly total: number; readonly interest: number } | null
}

const DURATION = /(\d+(?:\.\d+)?)\s*(years?|yrs?|y|months?|mos?|m)\b/i
const AMOUNT = /£?\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand)?\b/i

export function parseGoal(text: string): Goal | null {
	const duration = DURATION.exec(text)
	if (duration == null) return null
	const [match, countText = '', unit = ''] = duration
	const count = Number(countText)
	const months = /^m/i.test(unit) ? count : count * MONTHS_PER_YEAR

	const rest = text.slice(0, duration.index) + text.slice(duration.index + match.length)
	const money = AMOUNT.exec(rest)
	if (money == null) return null
	const [, amountText = '', thousands] = money
	const amount = Number(amountText.replaceAll(',', '')) * (thousands == null ? 1 : 1000)

	if (!Number.isFinite(amount) || amount < 1) return null
	if (!Number.isInteger(months) || months < 1 || months > MAX_MONTHS) return null
	return { amount, months }
}

function roundTo(value: number, step: number): number {
	return Math.round(value / step) * step
}

export function splitGoal({ amount, months }: Goal): PlanSplit {
	const exact = amount / months
	const month = exact >= ROUND_TO_FIVE_FROM ? Math.ceil(exact / 5) * 5 : Math.ceil(exact)
	const years = months / MONTHS_PER_YEAR
	const year = years >= 1 ? roundTo(amount / years, 10) : amount
	const perYear = month * MONTHS_PER_YEAR
	const daily = perYear / DAYS_PER_YEAR

	let grown: PlanSplit['grown'] = null
	if (months >= MONTHS_PER_YEAR) {
		const rate = EXAMPLE_ANNUAL_RATE / MONTHS_PER_YEAR
		const total = (month * ((1 + rate) ** months - 1)) / rate
		const interest = total - month * months
		const step = total >= 1000 ? 100 : 10
		grown = {
			total: roundTo(total, step),
			interest: roundTo(interest, interest >= 1000 ? 100 : 10)
		}
	}

	return {
		year,
		month,
		week: Math.round(perYear / WEEKS_PER_YEAR),
		// Pennies matter under £10 a day ("65p a day"); above it, whole pounds.
		day: daily >= 10 ? Math.round(daily) : Math.round(daily * 100) / 100,
		grown
	}
}
