import { colors, radii } from './tokens.ts'

// brand.css, rendered from tokens.ts. The web app's `.theme-brand` rule in
// globals.css adds what isn't a token (type sizes, the page font).

const kebab = (name: string) => name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

export function renderBrandCss(): string {
	const lines = [
		'/* Generated from packages/brand/src/tokens.ts by `pnpm --filter @kept/brand build:css`.',
		'   Edit the tokens, never this file: a test fails when the two differ. */',
		'.theme-brand {',
		...Object.entries(colors).map(([role, value]) => `\t--${kebab(role)}: ${value};`),
		`\t--radius-sm: ${radii.sm}px;`,
		`\t--radius: ${radii.md}px;`,
		`\t--radius-lg: ${radii.lg}px;`,
		'}',
		''
	]
	return lines.join('\n')
}
