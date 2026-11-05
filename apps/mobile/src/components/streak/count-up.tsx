import { useEffect, useState } from 'react'
import { Animated, Easing, type StyleProp, type TextStyle } from 'react-native'
import { Text } from '../ui/text'
import { useReducedMotion } from './motion'

// Long enough to feel each step at a small Streak, capped so a long one
// doesn't keep the user waiting.
const BASE_MS = 350
const PER_STEP_MS = 80
const MAX_MS = 1300
const BUMP_MS = 600
const BUMP_SCALE = 1.45

/**
 * A number that counts up from 0 once, after `delayMs`, then bumps as it
 * lands. Screen readers only ever get the final value; with Reduce Motion it
 * never moves.
 */
export function CountUp({
	value,
	delayMs,
	style
}: {
	value: number
	delayMs: number
	style?: StyleProp<TextStyle>
}) {
	const isReduced = useReducedMotion()
	const [shown, setShown] = useState(value)
	const [bump] = useState(() => new Animated.Value(0))

	useEffect(() => {
		if (isReduced !== false) return
		let frame = requestAnimationFrame(() => setShown(0))
		const duration = Math.min(MAX_MS, BASE_MS + value * PER_STEP_MS)
		const timer = setTimeout(() => {
			const start = Date.now()
			const step = () => {
				const progress = Math.min(1, (Date.now() - start) / duration)
				setShown(Math.round((1 - (1 - progress) ** 3) * value))
				if (progress < 1) {
					frame = requestAnimationFrame(step)
					return
				}
				Animated.timing(bump, {
					toValue: 1,
					duration: BUMP_MS,
					easing: Easing.out(Easing.cubic),
					useNativeDriver: true
				}).start()
			}
			frame = requestAnimationFrame(step)
		}, delayMs)
		return () => {
			clearTimeout(timer)
			cancelAnimationFrame(frame)
		}
	}, [isReduced, value, delayMs, bump])

	const scale = bump.interpolate({
		inputRange: [0, 0.35, 1],
		outputRange: [1, BUMP_SCALE, 1],
		extrapolate: 'clamp'
	})
	return (
		<Animated.View style={{ transform: [{ scale }] }}>
			<Text style={style} accessibilityLabel={String(value)}>
				{String(shown)}
			</Text>
		</Animated.View>
	)
}
