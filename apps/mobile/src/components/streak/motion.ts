import { useEffect, useState } from 'react'
import { AccessibilityInfo, Animated, Easing } from 'react-native'

// The motion the Streak and Comeback moments share (ADR 0004). Bold on
// purpose, and still for anyone who turned on Reduce Motion.

/** Overshoots and settles: the pop, drop and slam entrances. */
export const BOUNCE = Easing.out(Easing.back(2.2))

/** Null until the setting is known, so nothing plays before then. */
export function useReducedMotion(): boolean | null {
	const [isReduced, setIsReduced] = useState<boolean | null>(null)
	useEffect(() => {
		let isLive = true
		void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
			if (isLive) setIsReduced(value)
		})
		const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setIsReduced)
		return () => {
			isLive = false
			subscription.remove()
		}
	}, [])
	return isReduced
}

/**
 * A 0 to 1 value for an entrance that plays once, after `delayMs`. When
 * `play` is false, or motion is reduced, it sits at 1: the finished state.
 */
export function useEntrance({
	play,
	delayMs,
	durationMs,
	easing = BOUNCE
}: {
	play: boolean
	delayMs: number
	durationMs: number
	easing?: (value: number) => number
}): Animated.Value {
	const [progress] = useState(() => new Animated.Value(play ? 0 : 1))
	const isReduced = useReducedMotion()
	useEffect(() => {
		if (!play || isReduced == null) return
		if (isReduced) {
			progress.setValue(1)
			return
		}
		const animation = Animated.timing(progress, {
			toValue: 1,
			delay: delayMs,
			duration: durationMs,
			easing,
			useNativeDriver: true
		})
		animation.start()
		return () => animation.stop()
	}, [play, isReduced, progress, delayMs, durationMs, easing])
	return progress
}

/** A 0 to 1 value that repeats, for the forgiveness glow. Still at 0 when motion is reduced. */
export function useLoop({
	play,
	delayMs,
	durationMs
}: {
	play: boolean
	delayMs: number
	durationMs: number
}): Animated.Value {
	const [progress] = useState(() => new Animated.Value(0))
	const isReduced = useReducedMotion()
	useEffect(() => {
		if (!play || isReduced !== false) return
		const animation = Animated.sequence([
			Animated.delay(delayMs),
			Animated.loop(
				Animated.timing(progress, {
					toValue: 1,
					duration: durationMs,
					easing: Easing.out(Easing.quad),
					useNativeDriver: true
				})
			)
		])
		animation.start()
		return () => animation.stop()
	}, [play, isReduced, progress, delayMs, durationMs])
	return progress
}
