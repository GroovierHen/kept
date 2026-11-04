import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native'
import { colors, fontFamily, radii, space, type } from '@/lib/theme'
import { Text } from './text'

/** A labelled text box, with its error under it and, when it has a limit, a count. */
export function TextField({
	label,
	error,
	maxLength,
	value,
	multiline,
	...props
}: Omit<TextInputProps, 'style'> & { label: string; error?: string | null; value: string }) {
	return (
		<View style={styles.field}>
			<Text variant="small" style={styles.label}>
				{label}
			</Text>
			<TextInput
				accessibilityLabel={label}
				accessibilityHint={error ?? undefined}
				placeholderTextColor={colors.textFaint}
				maxLength={maxLength}
				value={value}
				multiline={multiline}
				textAlignVertical={multiline ? 'top' : 'center'}
				style={[styles.input, multiline && styles.multiline, error != null && styles.invalid]}
				{...props}
			/>
			<View style={styles.foot}>
				{error != null ? (
					<Text variant="small" tone="danger" accessibilityRole="alert" style={styles.grow}>
						{error}
					</Text>
				) : (
					<View style={styles.grow} />
				)}
				{maxLength != null && (
					<Text variant="small" tone="muted">
						{`${value.length}/${maxLength}`}
					</Text>
				)}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	field: { gap: space.xs },
	label: { fontFamily: fontFamily.textBold },
	input: {
		...type.body,
		fontFamily: fontFamily.text,
		color: colors.text,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.borderStrong,
		borderRadius: radii.md,
		paddingHorizontal: space.md,
		paddingVertical: 14
	},
	multiline: { minHeight: 120 },
	invalid: { borderColor: colors.danger },
	foot: { flexDirection: 'row', gap: space.sm, minHeight: 4 },
	grow: { flex: 1 }
})
