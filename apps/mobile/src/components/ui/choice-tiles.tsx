import { Pressable, StyleSheet, View } from 'react-native'
import { colors, fontFamily, radii, space } from '@/lib/theme'
import { Text } from './text'

export interface Choice<V extends string> {
	readonly value: V
	readonly label: string
	readonly detail?: string
}

/** Pick one: a radio group drawn as tiles, the picked one filled. */
export function ChoiceTiles<V extends string>({
	label,
	choices,
	value,
	onChange,
	disabled = false,
	direction = 'column'
}: {
	label: string
	choices: readonly Choice<V>[]
	value: V | null
	onChange: (value: V) => void
	disabled?: boolean
	direction?: 'column' | 'row'
}) {
	return (
		<View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles[direction]}>
			{choices.map((choice) => {
				const isPicked = choice.value === value
				return (
					<Pressable
						key={choice.value}
						accessibilityRole="radio"
						accessibilityLabel={choice.label}
						accessibilityState={{ checked: isPicked, disabled }}
						disabled={disabled}
						onPress={() => onChange(choice.value)}
						style={({ pressed }) => [
							styles.tile,
							direction === 'row' && styles.rowTile,
							isPicked && styles.picked,
							pressed && !isPicked && styles.pressed,
							disabled && styles.disabled
						]}
					>
						<Text style={[styles.label, { color: isPicked ? colors.accentInk : colors.text }]}>
							{choice.label}
						</Text>
						{choice.detail != null && (
							<Text
								variant="small"
								style={{ color: isPicked ? colors.accentSoft : colors.textMuted }}
							>
								{choice.detail}
							</Text>
						)}
					</Pressable>
				)
			})}
		</View>
	)
}

const styles = StyleSheet.create({
	column: { gap: space.sm },
	row: { flexDirection: 'row', gap: space.sm },
	tile: {
		minHeight: 52,
		justifyContent: 'center',
		gap: 2,
		paddingHorizontal: space.md,
		paddingVertical: 12,
		borderRadius: radii.md,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		backgroundColor: colors.surface
	},
	rowTile: { flex: 1, alignItems: 'center' },
	picked: { backgroundColor: colors.accent, borderColor: colors.accent },
	pressed: { backgroundColor: colors.surfaceHover },
	disabled: { opacity: 0.6 },
	label: { fontFamily: fontFamily.textBold }
})
