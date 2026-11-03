// The one place a pence amount becomes the text a user reads. Amounts are stored
// in pence and rounded only for display, and the app is pounds only.

const PENCE_PER_POUND = 100

const WHOLE_POUNDS = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })
const POUNDS_AND_PENCE = new Intl.NumberFormat('en-GB', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
})

export function formatPence({ pence, isRounded = false }: { pence: number; isRounded?: boolean }) {
	const absolutePence = Math.round(Math.abs(pence))
	const sign = pence < 0 ? '-' : ''

	if (absolutePence === 0) return '£0'
	if (absolutePence < PENCE_PER_POUND) return `${sign}${absolutePence}p`

	const pounds = absolutePence / PENCE_PER_POUND
	const format =
		isRounded || absolutePence % PENCE_PER_POUND === 0 ? WHOLE_POUNDS : POUNDS_AND_PENCE
	return `${sign}£${format.format(pounds)}`
}
