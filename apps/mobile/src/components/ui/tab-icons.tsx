import type { ColorValue } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'

// The two tab icons, drawn here: the app has no icon set, and two shapes don't need one.

const SIZE = 24
const STROKE = 2

export function TodayIcon({ color }: { color: ColorValue }) {
	return (
		<Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
			<Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={STROKE} />
			<Path d="m8 12 3 3 5-6" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
		</Svg>
	)
}

export function LedgerIcon({ color }: { color: ColorValue }) {
	return (
		<Svg width={SIZE} height={SIZE} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden>
			<Path
				d="M5 4h14v16H5zM9 9h6M9 13h6M9 17h3"
				stroke={color}
				strokeWidth={STROKE}
				strokeLinejoin="round"
				strokeLinecap="round"
			/>
		</Svg>
	)
}
