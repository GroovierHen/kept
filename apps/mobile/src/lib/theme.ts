import { colors, fonts, radii } from '@kept/brand'

/**
 * The brand tokens (packages/brand), shaped for React Native. The same values
 * the web app's .theme-brand pages wear, so the phone and the site match.
 */
export { colors, radii }

// The names useFonts registers in app/_layout.tsx.
export const fontFamily = {
	display: 'BricolageGrotesque_700Bold',
	text: 'Inter_400Regular',
	textMedium: 'Inter_500Medium',
	textBold: 'Inter_600SemiBold'
} as const

/** The display face's tracking at a given size, in points. */
export const displayTracking = (size: number) => size * fonts.displayTracking

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const

/** The type steps the app uses, fixed sizes from the design's narrow end. */
export const type = {
	small: { fontSize: 13, lineHeight: 19 },
	body: { fontSize: 17, lineHeight: 25 },
	lead: { fontSize: 22, lineHeight: 27 },
	title: { fontSize: 32, lineHeight: 33 },
	head: { fontSize: 40, lineHeight: 40 }
} as const
