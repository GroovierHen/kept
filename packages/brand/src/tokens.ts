// Kept's look, once (the Nov 3 redesign, DESIGN.md): forest green on an
// off-white ground, a lime second accent, near-black night fields,
// Bricolage Grotesque for display and Inter for text. The web app reads these
// as CSS variables on `.theme-brand` (brand.css, generated from this file);
// the mobile app reads the values. Changing the scheme is a change here alone.

export const colors = {
	bg: '#f4f5f0',
	surface: '#ffffff',
	surfaceHover: '#eef0e8',
	border: '#e2e4da',
	borderStrong: '#d6d9cc',
	text: '#0f1f17',
	textMuted: '#46504a',
	textFaint: '#56605a',
	accent: '#14532d',
	accentHover: '#0b3b1f',
	accentInk: '#ffffff',
	accentSoft: '#e6f2d9',
	accentDeep: '#0b3b1f',
	coral: '#c6f432',
	coralInk: '#0f1f17',
	coralSoft: '#eef9c9',
	coralDeep: '#3f6212',
	night: '#0f1f17',
	nightInk: '#ffffff',
	nightSurface: '#16291f',
	nightBorder: '#24402f',
	nightMuted: '#c3cfc6',
	kept: '#34d399',
	keptInk: '#062b1e',
	keptSoft: '#ddf6ec',
	partly: '#fbbf24',
	slipped: '#f87171',
	success: '#047857',
	warning: '#3f6212',
	danger: '#b42318',
	/** The hover glow on filled actions. */
	glow: 'rgb(20 83 45 / 0.55)',
	/** The focus halo on fields. */
	focusRing: 'rgb(20 83 45 / 0.15)',
	/** The shadow under what floats. */
	shadow: 'rgb(15 31 23 / 0.5)'
} as const

/** Corner radii in pixels. */
export const radii = { sm: 9, md: 14, lg: 24 } as const

export const fonts = {
	display: 'Bricolage Grotesque',
	text: 'Inter',
	/** The display face's tracking, as a fraction of the font size. */
	displayTracking: -0.03
} as const

export type ColorRole = keyof typeof colors
