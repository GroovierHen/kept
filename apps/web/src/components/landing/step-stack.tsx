'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

// "How it works" as a held stage on wide screens: the section is several
// screens tall and its stage sticks, so scrolling deals the four cards onto a
// stack, each pushing the last one up and back. Nothing hijacks the scroll;
// the card is read from how far the section has scrolled past. The stage is
// only set up once this script has run: on a phone, in a window under 640px
// tall, for anyone who asks for reduced motion, or before the script runs, the
// cards are a plain list. Under 800px tall only the stage's own gaps close up,
// so a whole card still fits at the design's sizes.
const STACKED =
	'(min-width: 1024px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)'
const NAV_H = 64
const STAGE_MAX_H = 860

// Where each card sits while another is on top: below and hidden until its
// turn, then pushed back one step for each card laid over it.
const AHEAD = 'translate-y-[115%] rotate-2 opacity-0'
const BEHIND = [
	'',
	'-translate-y-[22px] scale-95 opacity-85',
	'-translate-y-[44px] scale-90 opacity-70',
	'-translate-y-[66px] scale-[0.85] opacity-0'
]

export function StepStack({
	eyebrow,
	heading,
	stepsLabel,
	labels,
	hint,
	hintLast,
	cards
}: {
	eyebrow: string
	heading: string
	stepsLabel: string
	labels: readonly string[]
	hint: string
	hintLast: string
	cards: readonly React.ReactNode[]
}) {
	const id = useId()
	const ref = useRef<HTMLElement>(null)
	const [stacked, setStacked] = useState(false)
	const [progress, setProgress] = useState(0)
	const last = cards.length - 1
	const active = Math.min(last, Math.floor(progress * cards.length))

	useEffect(() => {
		const section = ref.current
		if (section == null) return
		const query = window.matchMedia(STACKED)
		let frame = 0
		const read = () => {
			frame = 0
			setStacked(query.matches)
			if (!query.matches) return
			const rect = section.getBoundingClientRect()
			const travel = rect.height - Math.min(window.innerHeight - NAV_H, STAGE_MAX_H)
			const value = travel > 0 ? Math.min(1, Math.max(0, (NAV_H - rect.top) / travel)) : 0
			setProgress(Math.round(value * 400) / 400)
		}
		const onChange = () => {
			if (frame === 0) frame = requestAnimationFrame(read)
		}
		read()
		window.addEventListener('scroll', onChange, { passive: true })
		window.addEventListener('resize', onChange)
		query.addEventListener('change', onChange)
		return () => {
			cancelAnimationFrame(frame)
			window.removeEventListener('scroll', onChange)
			window.removeEventListener('resize', onChange)
			query.removeEventListener('change', onChange)
		}
	}, [])

	// Scrolls to the middle of that card's share of the stage, or on a phone
	// to the card itself.
	const goTo = (index: number) => {
		const section = ref.current
		if (section == null) return
		if (!stacked) {
			document.getElementById(`${id}-card-${index}`)?.scrollIntoView({ behavior: 'smooth' })
			return
		}
		const rect = section.getBoundingClientRect()
		const travel = rect.height - Math.min(window.innerHeight - NAV_H, STAGE_MAX_H)
		const target = NAV_H - ((index + 0.5) / cards.length) * travel
		window.scrollBy({ top: rect.top - target, behavior: 'smooth' })
	}

	return (
		<section
			id="how"
			ref={ref}
			aria-labelledby={`${id}-heading`}
			className={cn(
				'relative mt-16 scroll-mt-16',
				stacked && 'h-[calc(min(100svh-4rem,860px)+2400px)]'
			)}
		>
			<div
				className={cn(
					'short:pt-4 short:pb-3 mx-auto flex max-w-[1200px] flex-col px-(--page-margin) pt-8 pb-7',
					stacked && 'sticky top-16 h-[min(calc(100svh-4rem),860px)]'
				)}
			>
				<div className="flex flex-wrap items-end justify-between gap-5">
					<div data-reveal>
						<p className="text-accent text-[14px] font-semibold tracking-[0.08em] uppercase">
							{eyebrow}
						</p>
						<h2
							id={`${id}-heading`}
							className="face-display mt-3 text-[clamp(34px,4.4vw,56px)] leading-none font-extrabold"
						>
							{heading}
						</h2>
					</div>
					<ol aria-label={stepsLabel} className="flex flex-wrap gap-2">
						{labels.map((label, index) => {
							const current = stacked && index === active
							const done = stacked && index < active
							return (
								<li key={label}>
									<button
										type="button"
										aria-current={current ? 'step' : undefined}
										onClick={() => goTo(index)}
										className={cn(
											'flex min-h-11 items-center gap-2 rounded-full border py-[9px] pr-3.5 pl-[9px] text-[14px] font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2',
											current
												? 'bg-night border-night text-night-ink'
												: 'bg-surface border-border text-text'
										)}
									>
										<span
											className={cn(
												'grid size-6 place-items-center rounded-full text-[12px] transition-colors duration-300',
												current
													? 'bg-coral text-coral-ink'
													: done
														? 'bg-accent text-accent-ink'
														: 'bg-accent-soft text-accent-deep'
											)}
										>
											{index + 1}
										</span>
										{label}
									</button>
								</li>
							)
						})}
					</ol>
				</div>

				{stacked ? (
					<div
						aria-hidden
						className="bg-border short:mt-3 mt-[22px] h-1 overflow-hidden rounded-[4px]"
					>
						<div
							className="bg-accent h-full origin-left rounded-[4px]"
							style={{ transform: `scaleX(${progress})` }}
						/>
					</div>
				) : null}

				<div
					className={cn(
						'relative min-h-0 flex-1',
						stacked ? 'short:mt-5 mt-11 block' : 'mt-7 grid gap-[18px]'
					)}
				>
					{cards.map((card, index) => (
						<div
							key={labels[index]}
							id={`${id}-card-${index}`}
							className={cn(
								'scroll-mt-24',
								stacked &&
									'absolute inset-0 transition-[translate,scale,rotate,opacity] duration-800 ease-(--ease-out)',
								stacked &&
									(index > active ? AHEAD : BEHIND[Math.min(active - index, BEHIND.length - 1)])
							)}
							style={{ zIndex: index + 1 }}
						>
							{card}
						</div>
					))}
				</div>

				{stacked ? (
					<p className="text-text-faint short:hidden mt-3.5 text-center text-[13px]">
						{active < last ? hint : hintLast}
					</p>
				) : null}
			</div>
		</section>
	)
}
