'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

// Long enough to feel each step at a small Streak, capped so a long one
// doesn't keep the user waiting.
const BASE_MS = 350
const PER_STEP_MS = 80
const MAX_MS = 1300

/**
 * A number that counts up from 0 once, after `delayMs`, then bumps as it
 * lands. The server renders the final value and screen readers only ever get
 * that; with reduced motion it never moves.
 */
export function CountUp({
	value,
	delayMs,
	className
}: {
	value: number
	delayMs: number
	className?: string
}) {
	const [shown, setShown] = useState(value)
	const [hasLanded, setHasLanded] = useState(false)

	useEffect(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
		let frame = 0
		const duration = Math.min(MAX_MS, BASE_MS + value * PER_STEP_MS)
		const timer = window.setTimeout(() => {
			const start = performance.now()
			const step = (now: number) => {
				const progress = Math.min(1, (now - start) / duration)
				setShown(Math.round((1 - (1 - progress) ** 3) * value))
				if (progress < 1) frame = requestAnimationFrame(step)
				else setHasLanded(true)
			}
			frame = requestAnimationFrame(step)
		}, delayMs)
		// Starts at 0 while the number is still hidden by its entrance.
		frame = requestAnimationFrame(() => setShown(0))
		return () => {
			window.clearTimeout(timer)
			cancelAnimationFrame(frame)
		}
	}, [value, delayMs])

	return (
		<span className={className}>
			<span
				aria-hidden
				className={cn(
					'inline-block [transform-origin:left_bottom] tabular-nums',
					hasLanded && 'motion-safe:animate-[streak-bump_.6s_cubic-bezier(.3,1.7,.5,1)]'
				)}
			>
				{shown}
			</span>
			<span className="sr-only">{value}</span>
		</span>
	)
}
