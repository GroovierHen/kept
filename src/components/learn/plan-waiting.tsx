'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import { TallyMark } from '@/components/ui/tally-mark'

// What the person sees while the AI writes their plan, 10 to 30 seconds. The
// tally from the loading screens draws, and the wait explains the daily loop
// with their own goal, one sentence at a time. Nothing claims to know what
// the AI is doing at a given moment: it can't be known, so a timed "choosing
// milestones…" would be made up. A long wait says so plainly.

const SECONDS_PER_LINE = 6
const SLOW_AFTER_SECONDS = 30
const TICK_MS = 1000
// A refreshed page has no request of its own to wait on, so it looks again.
const REFRESH_EVERY_MS = 3000
// The goal is quoted mid-sentence, so its own full stop would double up.
const TRAILING_PUNCTUATION = /[\s.!?]+$/

export function PlanWaiting({
	title,
	goalText,
	secondsSoFar = 0,
	shouldRefresh = false
}: {
	title: string
	/** Explains the daily loop with this goal. Left out on Try again, when the plan is on screen. */
	goalText?: string
	/** How long the build has already run, for a page refreshed mid-build. */
	secondsSoFar?: number
	/** Reload the page until the build is over, when this page didn't start it. */
	shouldRefresh?: boolean
}) {
	const t = useTranslations('Learn.plan.wait')
	const router = useRouter()
	const [seconds, setSeconds] = useState(secondsSoFar)

	useEffect(() => {
		const tick = setInterval(() => setSeconds((current) => current + 1), TICK_MS)
		return () => clearInterval(tick)
	}, [])

	useEffect(() => {
		if (!shouldRefresh) return
		const look = setInterval(() => router.refresh(), REFRESH_EVERY_MS)
		return () => clearInterval(look)
	}, [shouldRefresh, router])

	const loop =
		goalText == null
			? []
			: [
					t('promise', { goal: goalText.replace(TRAILING_PUNCTUATION, '') }),
					t('report'),
					t('adapt')
				]
	const shown = loop.slice(0, 1 + Math.floor(seconds / SECONDS_PER_LINE))

	return (
		<div role="status" className="page-loading flex flex-col gap-4">
			<div className="flex items-center gap-3">
				<TallyMark className="h-8 w-8 shrink-0" />
				<p className="text-body font-semibold">{title}</p>
			</div>
			{shown.length > 0 && (
				<ul className="flex flex-col gap-2">
					{shown.map((line) => (
						<li key={line} className="plan-waiting-line text-body">
							{line}
						</li>
					))}
				</ul>
			)}
			{seconds >= SLOW_AFTER_SECONDS && <p className="text-small text-text-muted">{t('slow')}</p>}
		</div>
	)
}
