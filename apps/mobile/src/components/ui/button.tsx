import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native'
import { colors, fontFamily, radii, space, type } from '@/lib/theme'
import { Text } from './text'

type Variant = 'primary' | 'secondary' | 'quiet'

export function Button({
	label,
	variant = 'primary',
	isPending = false,
	disabled,
	...props
}: Omit<PressableProps, 'children'> & { label: string; variant?: Variant; isPending?: boolean }) {
	const isDisabled = disabled === true || isPending
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled: isDisabled, busy: isPending }}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.base,
				styles[variant],
				pressed && styles[`${variant}Pressed`],
				isDisabled && styles.disabled
			]}
			{...props}
		>
			{isPending && (
				<ActivityIndicator color={variant === 'primary' ? colors.accentInk : colors.accent} />
			)}
			<Text
				style={[styles.label, { color: variant === 'primary' ? colors.accentInk : colors.accent }]}
			>
				{label}
			</Text>
		</Pressable>
	)
}

const styles = StyleSheet.create({
	base: {
		minHeight: 52,
		borderRadius: radii.md,
		paddingHorizontal: space.lg,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: space.sm
	},
	primary: { backgroundColor: colors.accent },
	primaryPressed: { backgroundColor: colors.accentHover },
	secondary: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
	secondaryPressed: { backgroundColor: colors.surfaceHover },
	quiet: { backgroundColor: 'transparent' },
	quietPressed: { backgroundColor: colors.surfaceHover },
	disabled: { opacity: 0.6 },
	label: { ...type.body, fontFamily: fontFamily.textBold }
})
