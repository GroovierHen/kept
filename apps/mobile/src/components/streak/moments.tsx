import { Animated, StyleSheet, View } from 'react-native'
import type { TodayResponse } from '@kept/contract'
import { copy } from '@/copy'
import { colors, fontFamily, space } from '@/lib/theme'
import { Text } from '../ui/text'
import { CheckGlyph, ComebackGlyph } from './glyphs'
import { useEntrance } from './motion'

// The done step's two moments (ADR 0004): the check-in landing, and a
// Comeback arriving as a return rather than a slip.

const BADGE = 56
const RING_SCALE = 2.8
const COMEBACK_ICON = 32

/** The lime check: it spins in, overshoots and settles, and two rings ripple out. */
export function DoneBadge() {
	const pop = useEntrance({ play: true, delayMs: 0, durationMs: 750 })
	const ring = useEntrance({ play: true, delayMs: 300, durationMs: 1100, easing: (t) => t })
	const ringLate = useEntrance({ play: true, delayMs: 550, durationMs: 1100, easing: (t) => t })
	const rotate = pop.interpolate({ inputRange: [0, 1], outputRange: ['-30deg', '0deg'] })

	return (
		<View
			style={styles.badgeBox}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			<Ripple progress={ring} color={colors.coral} width={5} />
			<Ripple progress={ringLate} color={colors.accent} width={3} />
			<Animated.View
				style={[styles.badge, { opacity: pop, transform: [{ scale: pop }, { rotate }] }]}
			>
				<CheckGlyph size={26} color={colors.accent} />
			</Animated.View>
		</View>
	)
}

function Ripple({
	progress,
	color,
	width
}: {
	progress: Animated.Value
	color: string
	width: number
}) {
	// At rest (1) it has grown and faded out, so a still screen shows no ring.
	const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.7, RING_SCALE] })
	const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] })
	return (
		<Animated.View
			style={[
				StyleSheet.absoluteFill,
				styles.ripple,
				{ borderColor: color, borderWidth: width, opacity, transform: [{ scale }] }
			]}
		/>
	)
}

/** "You're back": it drops in from above and bounces, and its arrow spins a turn backwards. */
export function ComebackBanner({ streak }: { streak: TodayResponse['streak'] }) {
	const isComeback = streak.comebackToday != null
	const drop = useEntrance({ play: isComeback, delayMs: 900, durationMs: 850 })
	const spin = useEntrance({ play: isComeback, delayMs: 1250, durationMs: 800 })
	if (streak.comebackToday == null) return null

	const translateY = drop.interpolate({ inputRange: [0, 1], outputRange: [-70, 0] })
	const scale = drop.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] })
	const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] })

	return (
		<Animated.View
			style={[styles.banner, { opacity: drop, transform: [{ translateY }, { scale }] }]}
		>
			<Animated.View style={[styles.bannerIcon, { transform: [{ rotate }] }]}>
				<ComebackGlyph size={18} color={colors.coral} />
			</Animated.View>
			<Text style={styles.bannerText} accessibilityRole="text">
				{copy.done.comeback[streak.comebackToday](streak.days)}
			</Text>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	badgeBox: { width: BADGE, height: BADGE, marginTop: space.md },
	badge: {
		...StyleSheet.absoluteFill,
		borderRadius: BADGE / 2,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.coral
	},
	ripple: { borderRadius: BADGE / 2 },
	banner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: space.sm + space.xs,
		padding: space.sm + space.xs,
		borderRadius: 18,
		borderWidth: 1.5,
		borderColor: colors.accent,
		backgroundColor: colors.accentSoft
	},
	bannerIcon: {
		width: COMEBACK_ICON,
		height: COMEBACK_ICON,
		borderRadius: COMEBACK_ICON / 2,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: colors.accent
	},
	bannerText: { flex: 1, fontFamily: fontFamily.textBold }
})
