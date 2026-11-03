'use client'

import { useState } from 'react'
import { CheckIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import type { DayOutcome } from '@/lib/ledger'

export interface LedgerDay {
	readonly day: number
	/** "Day 3" */
	readonly label: string
	readonly outcome: DayOutcome
	readonly outcomeLabel: string
	/** The Promise for the day as a sentence, null with none. */
	readonly sentence: string | null
}

// Every day since sign-up as a mark; picking one shows the promise made for it
// and what the user said. Starts on the latest day that has a promise.
export function DayByDay({ days, noPromise }: { days: readonly LedgerDay[]; noPromise: string }) {
	const latest = days.findLast(({ sentence }) => sentence != null) ?? days.at(-1)
	const [picked, setPicked] = useState(latest?.day ?? null)
	const shown = days.find(({ day }) => day === picked)

	return (
		<>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2">
				{days.map(({ day, label, outcome, outcomeLabel }) => {
					const isPicked = day === picked
					return (
						<button
							key={day}
							type="button"
							aria-pressed={isPicked}
							aria-label={`${label}: ${outcomeLabel}`}
							onClick={() => setPicked(day)}
							className={cn(
								'hover:border-accent focus-visible:outline-accent flex min-h-[72px] flex-col items-center justify-between gap-2 rounded-[14px] border-2 px-1 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2',
								isPicked ? 'border-accent bg-accent-soft' : 'border-border bg-surface'
							)}
						>
							<DayMark outcome={outcome} />
							<span aria-hidden className="text-[13px] font-semibold">
								{day}
							</span>
						</button>
					)
				})}
			</div>

			{shown != null && (
				<div className="bg-bg mt-[18px] flex flex-wrap items-start justify-between gap-4 rounded-[18px] px-5 py-[18px]">
					<div className="min-w-0 flex-[1_1_280px]">
						<p className="text-text-faint text-[13px] font-medium">{shown.label}</p>
						<p
							aria-live="polite"
							className="face-display mt-1.5 text-[22px] leading-[1.2] font-bold"
						>
							{shown.sentence ?? noPromise}
						</p>
					</div>
					<p
						className={cn(
							'flex-none rounded-full border-[1.5px] px-3.5 py-1.5 text-[14px] font-bold',
							shown.outcome === 'kept' && 'border-accent bg-coral text-coral-ink',
							shown.outcome === 'partly' && 'border-accent bg-accent-soft',
							shown.outcome === 'slipped' && 'border-border-strong bg-surface',
							['open', 'unreported', 'noPromise'].includes(shown.outcome) &&
								'border-border bg-surface text-text-muted'
						)}
					>
						{shown.outcomeLabel}
					</p>
				</div>
			)}
		</>
	)
}

function DayMark({ outcome }: { outcome: DayOutcome }) {
	return (
		<span
			aria-hidden
			className={cn(
				'text-coral grid size-7 place-items-center rounded-full border-2',
				outcome === 'kept' && 'border-accent bg-accent',
				outcome === 'partly' &&
					'border-accent bg-[linear-gradient(90deg,transparent_50%,var(--accent)_50%)]',
				outcome === 'slipped' && 'border-text-faint',
				outcome !== 'kept' &&
					outcome !== 'partly' &&
					outcome !== 'slipped' &&
					'border-text-faint border-dashed'
			)}
		>
			{outcome === 'kept' && <CheckIcon size={14} />}
		</span>
	)
}
