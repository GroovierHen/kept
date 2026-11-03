import { StyleSheet, View, type ViewProps } from 'react-native'
import { colors, radii, space } from '@/lib/theme'

/** A surface on the ground; `night` is the near-black field the design uses for what matters most. */
export function Card({
	tone = 'surface',
	style,
	...props
}: ViewProps & { tone?: 'surface' | 'night' }) {
	return <View {...props} style={[styles.base, styles[tone], style]} />
}

const styles = StyleSheet.create({
	base: { borderRadius: radii.lg, padding: space.lg, gap: space.sm },
	surface: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
	night: { backgroundColor: colors.night }
})
