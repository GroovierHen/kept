const FULL = 100

export function progressPercent({ value, max }: { value: number; max: number }) {
	if (!(max > 0) || Number.isNaN(value)) return 0
	if (value >= max) return FULL
	return Math.max(0, Math.min(FULL - 1, Math.round((value / max) * FULL)))
}
