import { Animated, StyleSheet, View } from 'react-native'
import { IN_A_ROW_TO_FORGIVE_AGAIN, type TodayResponse } from '@kept/contract'
import { copy } from '@/copy'
import { colors, displayTracking, fontFamily, radii, space } from '@/lib/theme'
import { Text } from '../ui/text'
import { CountUp } from './count-up'
import { ShieldGlyph } from './glyphs'
import { BOUNCE, useEntrance, useLoop } from './motion'

// When each part moves on the done step, in ms: the card rises, the number
// counts, then the forgiveness card lands and its bars fill one by one.
const COUNT_DELAY_MS = 800
const SHIELD_DELAY_MS = 1400
const PIP_DELAY_MS = 1900
const PIP_STEP_MS = 180
const GLOW_DELAY_MS = 1800

const NUMBER_SIZE = 64
const UNIT_SIZE = 24
const SHIELD = 40
const GLOW_SPREAD = 1.7

/**
 * The Streak on Today (ADR 0004): how many days, the best, and whether the
 * next Empty day is forgiven, with the way back to forgiveness once it's used.
 * Hidden at 0, so a Streak that ended never shows as lost. `celebrate` plays
 * its entrance, for the done step.
 */
export function StreakCard({
	streak,
	celebrate
}: {
	streak: TodayResponse['streak']
	celebrate: boolean
}) {
	const rise = useEntrance({ play: celebrate, delayMs: 400, durationMs: 900 })
	const land = useEntrance({ play: celebrate, delayMs: SHIELD_DELAY_MS, durationMs: 700 })
	const glow = useLoop({
		play: streak.days > 0 && streak.isForgivenessReady,
		delayMs: GLOW_DELAY_MS,
		durationMs: 1600
	})
	if (streak.days === 0) return null

	const isReady = streak.isForgivenessReady
	const inARow = Math.min(streak.inARow, IN_A_ROW_TO_FORGIVE_AGAIN)
	const riseY = rise.interpolate({ inputRange: [0, 1], outputRange: [160, 0] })
	const landY = land.interpolate({ inputRange: [0, 1], outputRange: [28, 0] })
	const wobble = land.interpolate({
		inputRange: [0, 0.4, 0.7, 1],
		outputRange: ['-20deg', '15deg', '-6deg', '0deg']
	})
	const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [1, GLOW_SPREAD] })
	const glowOpacity = glow.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.9, 0, 0] })

	return (
		<Animated.View style={[styles.card, { opacity: rise, transform: [{ translateY: riseY }] }]}>
			<View style={styles.ring} />
			<Text variant="eyebrow" tone="ink" style={styles.soft}>
				{copy.today.streak.heading}
			</Text>
			<View style={styles.count}>
				{celebrate ? (
					<CountUp value={streak.days} delayMs={COUNT_DELAY_MS} style={styles.number} />
				) : (
					<Text style={styles.number}>{String(streak.days)}</Text>
				)}
				<Text style={styles.unit}>{copy.today.streak.unit(streak.days)}</Text>
			</View>
			<Text tone="ink" style={styles.soft}>
				{copy.today.streak.lead(streak.best)}
			</Text>

			<Animated.View
				style={[styles.forgiveness, { opacity: land, transform: [{ translateY: landY }] }]}
			>
				<View>
					{isReady && (
						<Animated.View
							style={[
								StyleSheet.absoluteFill,
								styles.glow,
								{ opacity: glowOpacity, transform: [{ scale: glowScale }] }
							]}
						/>
					)}
					<Animated.View
						style={[
							styles.shield,
							isReady ? styles.shieldReady : styles.shieldUsed,
							{ transform: [{ rotate: wobble }] }
						]}
					>
						<ShieldGlyph size={22} color={colors.accent} isChecked={isReady} />
					</Animated.View>
				</View>
				<View style={styles.forgivenessText}>
					<Text style={styles.strong}>
						{isReady ? copy.today.streak.safe : copy.today.streak.notSafe}
					</Text>
					{!isReady && (
						<View style={styles.pipsRow}>
							<View style={styles.pips} accessibilityElementsHidden>
								{Array.from({ length: IN_A_ROW_TO_FORGIVE_AGAIN }, (_, index) => (
									<View key={index} style={styles.pip}>
										{index < inARow && (
											<PipFill play={celebrate} delayMs={PIP_DELAY_MS + index * PIP_STEP_MS} />
										)}
									</View>
								))}
							</View>
							<Text variant="small" tone="muted" style={styles.strong}>
								{copy.today.streak.inARow(inARow, IN_A_ROW_TO_FORGIVE_AGAIN)}
							</Text>
						</View>
					)}
				</View>
			</Animated.View>
		</Animated.View>
	)
}

function PipFill({ play, delayMs }: { play: boolean; delayMs: number }) {
	const fill = useEntrance({ play, delayMs, durationMs: 450, easing: BOUNCE })
	return <Animated.View style={[styles.pipFill, { transform: [{ scaleX: fill }] }]} />
}

const styles = StyleSheet.create({
	card: {
		overflow: 'hidden',
		gap: space.sm,
		padding: space.lg - space.xs,
		borderRadius: radii.lg,
		backgroundColor: colors.accent
	},
	// The lime ring in the corner the web's green panel carries.
	ring: {
		position: 'absolute',
		top: -70,
		right: -70,
		width: 140,
		height: 140,
		borderRadius: 70,
		borderWidth: 26,
		borderColor: colors.coral
	},
	soft: { opacity: 0.85, paddingRight: space.xl * 2 },
	count: { flexDirection: 'row', alignItems: 'baseline', gap: space.sm + 2 },
	number: {
		fontFamily: fontFamily.display,
		fontSize: NUMBER_SIZE,
		lineHeight: NUMBER_SIZE,
		letterSpacing: displayTracking(NUMBER_SIZE),
		color: colors.accentInk,
		fontVariant: ['tabular-nums']
	},
	unit: {
		fontFamily: fontFamily.display,
		fontSize: UNIT_SIZE,
		letterSpacing: displayTracking(UNIT_SIZE),
		color: colors.accentInk
	},
	forgiveness: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: space.sm + space.xs,
		marginTop: space.sm,
		padding: space.md - 2,
		borderRadius: 16,
		backgroundColor: colors.surface
	},
	glow: { borderRadius: 12, backgroundColor: colors.coral },
	shield: {
		width: SHIELD,
		height: SHIELD,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: colors.accent,
		alignItems: 'center',
		justifyContent: 'center'
	},
	shieldReady: { backgroundColor: colors.coral },
	shieldUsed: { backgroundColor: colors.surface, borderStyle: 'dashed' },
	forgivenessText: { flex: 1, gap: space.sm },
	strong: { fontFamily: fontFamily.textBold },
	pipsRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
	pips: { flexDirection: 'row', gap: space.xs },
	pip: {
		width: 18,
		height: 8,
		borderRadius: 6,
		borderWidth: 2,
		borderColor: colors.accent,
		overflow: 'hidden'
	},
	pipFill: { flex: 1, backgroundColor: colors.accent, transformOrigin: 'left' }
})
