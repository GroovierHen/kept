import { Text as NativeText, StyleSheet, type TextProps } from 'react-native'
import { colors, displayTracking, fontFamily, type } from '@/lib/theme'

type Variant = 'head' | 'title' | 'lead' | 'body' | 'small' | 'eyebrow'
type Tone = 'default' | 'muted' | 'ink' | 'nightInk' | 'nightMuted' | 'danger'

const TONES: Record<Tone, string> = {
	default: colors.text,
	muted: colors.textMuted,
	ink: colors.accentInk,
	nightInk: colors.nightInk,
	nightMuted: colors.nightMuted,
	danger: colors.danger
}

export function Text({
	variant = 'body',
	tone = 'default',
	style,
	...props
}: TextProps & { variant?: Variant; tone?: Tone }) {
	return <NativeText {...props} style={[styles[variant], { color: TONES[tone] }, style]} />
}

const styles = StyleSheet.create({
	head: {
		...type.head,
		fontFamily: fontFamily.display,
		letterSpacing: displayTracking(type.head.fontSize)
	},
	title: {
		...type.title,
		fontFamily: fontFamily.display,
		letterSpacing: displayTracking(type.title.fontSize)
	},
	lead: { ...type.lead, fontFamily: fontFamily.textMedium },
	body: { ...type.body, fontFamily: fontFamily.text },
	small: { ...type.small, fontFamily: fontFamily.text },
	eyebrow: {
		...type.small,
		fontFamily: fontFamily.textBold,
		textTransform: 'uppercase',
		letterSpacing: 1
	}
})
