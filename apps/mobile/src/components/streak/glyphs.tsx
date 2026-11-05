import type { ColorValue } from 'react-native'
import Svg, { Path } from 'react-native-svg'

// The Streak's shapes, drawn here like the tab icons: the app has no icon set.

const STROKE = 2.2
const SHIELD = 'M12 3 5 6v5c0 4.4 3 8.3 7 10 4-1.7 7-5.6 7-10V6z'

type GlyphProps = { size: number; color: ColorValue }

/** Forgiveness: checked while it's ready, empty once it's been used. */
export function ShieldGlyph({ size, color, isChecked }: GlyphProps & { isChecked: boolean }) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
			<Path d={SHIELD} stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
			{isChecked && (
				<Path
					d="m9 12 2 2 4-4"
					stroke={color}
					strokeWidth={STROKE}
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			)}
		</Svg>
	)
}

/** A Comeback: an arrow turning back. */
export function ComebackGlyph({ size, color }: GlyphProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
			<Path
				d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"
				stroke={color}
				strokeWidth={STROKE}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	)
}

export function CheckGlyph({ size, color }: GlyphProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
			<Path
				d="M20 6 9 17l-5-5"
				stroke={color}
				strokeWidth={2.6}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	)
}
