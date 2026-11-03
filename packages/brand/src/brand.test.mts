import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { renderBrandCss } from './css.ts'
import { colors } from './tokens.ts'

test('brand.css is what tokens.ts renders — run build:css after editing the tokens', () => {
	const written = readFileSync(new URL('../brand.css', import.meta.url), 'utf8')
	assert.equal(written, renderBrandCss())
})

// WCAG 2.x relative luminance and contrast ratio.
function luminance(hex: string): number {
	const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
	const [r = 0, g = 0, b = 0] = channels.map((c) =>
		c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
	)
	return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
	return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05)
}

test('every text and ink pairing meets WCAG AA for body text (4.5:1)', () => {
	const pairs: [string, string][] = [
		[colors.text, colors.bg],
		[colors.text, colors.surface],
		[colors.textMuted, colors.bg],
		[colors.textFaint, colors.surface],
		[colors.accentInk, colors.accent],
		[colors.coralInk, colors.coral],
		[colors.nightInk, colors.night],
		[colors.nightMuted, colors.night],
		[colors.keptInk, colors.kept]
	]
	for (const [ink, ground] of pairs) {
		assert.ok(
			contrast(ink, ground) >= 4.5,
			`${ink} on ${ground} is ${contrast(ink, ground).toFixed(2)}:1`
		)
	}
})
