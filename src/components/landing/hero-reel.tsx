'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

// The hero's held stage. The section is several screens tall and its stage is
// sticky, so ordinary scrolling advances the reel one check-in step at a time
// while the sentence on either side holds still. Nothing hijacks the scroll:
// the step is read from how far the section has scrolled past.
export function HeroReel({
	label,
	frames,
	captions,
	className
}: {
	label: string
	frames: readonly React.ReactNode[]
	captions: readonly string[]
	className?: string
}) {
	const [step, setStep] = useState(0)
	const ref = useRef<HTMLElement>(null)

	useEffect(() => {
		const section = ref.current?.closest('[data-reel-track]')
		if (section == null) return
		let frame = 0
		const read = () => {
			frame = 0
			const rect = section.getBoundingClientRect()
			const travel = rect.height - window.innerHeight
			const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0
			setStep(Math.min(frames.length - 1, Math.floor(progress * frames.length)))
		}
		const onScroll = () => {
			if (frame === 0) frame = requestAnimationFrame(read)
		}
		read()
		window.addEventListener('scroll', onScroll, { passive: true })
		window.addEventListener('resize', onScroll)
		return () => {
			cancelAnimationFrame(frame)
			window.removeEventListener('scroll', onScroll)
			window.removeEventListener('resize', onScroll)
		}
	}, [frames.length])

	return (
		<figure
			ref={ref}
			aria-label={label}
			className={cn(
				// --frame-h is one frame's height: 4:3 at the page's full width on a
				// phone, 4:3 at 70vw on a tablet, 16:9 at 44vw on a wide screen. There
				// the gap is sized so a 60px sliver of the next frame shows at the
				// bottom of the screen.
				'flex flex-col gap-3',
				'[--frame-h:calc((100vw-2*var(--page-margin))*0.75)] [--reel-gap:1.5rem]',
				'md:[--frame-h:52.5vw]',
				'lg:[--frame-h:24.75vw] lg:[--reel-gap:calc((100svh-24.75vw)/2-60px)]',
				className
			)}
		>
			<div className="relative h-(--frame-h) overflow-hidden lg:overflow-visible">
				<ol
					className="flex flex-col gap-(--reel-gap) transition-transform duration-700 ease-(--ease-expo) motion-reduce:transition-none"
					style={{ transform: `translateY(calc(${-step} * (var(--frame-h) + var(--reel-gap))))` }}
				>
					{frames.map((content, index) => (
						<li
							key={captions[index]}
							aria-current={index === step ? 'step' : undefined}
							className={cn(
								'h-(--frame-h) shrink-0 transition-opacity duration-500',
								index === step ? 'opacity-100' : 'opacity-60'
							)}
						>
							{content}
						</li>
					))}
				</ol>
			</div>
			<figcaption className="text-small" aria-live="polite">
				{captions[step]}
			</figcaption>
		</figure>
	)
}
