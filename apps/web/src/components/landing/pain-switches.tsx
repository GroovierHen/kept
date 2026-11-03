'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'

// "Sound familiar?": the four reasons plans fail, each a switch. Switched on,
// a reason says what Kept does about it, and the count beside the heading
// goes up. The first starts on, so the section shows what a switch does.
const PAINS = ['stop', 'today', 'forget', 'badDay'] as const
type Pain = (typeof PAINS)[number]

export function PainSwitches() {
	const t = useTranslations('HomePage.pains')
	const id = useId()
	const [on, setOn] = useState<ReadonlySet<Pain>>(() => new Set(['stop']))

	const toggle = (pain: Pain) =>
		setOn((current) => {
			const next = new Set(current)
			if (next.has(pain)) next.delete(pain)
			else next.add(pain)
			return next
		})

	return (
		<section aria-labelledby={`${id}-heading`} className="bg-surface border-border border-y">
			<div className="mx-auto flex max-w-[1200px] flex-wrap gap-14 px-(--page-margin) py-28">
				<div className="min-w-0 flex-[1_1_340px]">
					<p
						data-reveal
						className="text-accent text-[14px] font-semibold tracking-[0.08em] uppercase"
					>
						{t('eyebrow')}
					</p>
					<h2
						id={`${id}-heading`}
						data-reveal
						className="face-display mt-3.5 mb-5 text-[clamp(40px,5vw,60px)] leading-none font-extrabold delay-[70ms]"
					>
						{t('heading')}
					</h2>
					<p
						data-reveal
						className="text-text-muted max-w-[420px] text-[17px] leading-[1.55] delay-[140ms]"
					>
						{t('support')}
					</p>
					<p
						data-reveal
						className="face-display text-accent mt-10 text-[96px] leading-none font-extrabold delay-[210ms]"
					>
						{on.size}
						<span className="text-text-faint text-[40px]">/{PAINS.length}</span>
					</p>
					<p aria-live="polite" className="mt-2 text-[18px] font-semibold">
						{on.size === 0 ? t('none') : t('count', { count: on.size })}
					</p>
				</div>

				<ul className="grid min-w-0 flex-[1.4_1_480px] content-start gap-3">
					{PAINS.map((pain, index) => {
						const active = on.has(pain)
						return (
							<li
								key={pain}
								data-reveal
								className={cn(
									index === 1 && 'delay-[80ms]',
									index === 2 && 'delay-[160ms]',
									index === 3 && 'delay-[240ms]'
								)}
							>
								<button
									type="button"
									aria-pressed={active}
									onClick={() => toggle(pain)}
									className={cn(
										'block w-full cursor-pointer rounded-[20px] border px-6 py-[22px] text-left transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
										active
											? 'bg-accent-soft border-accent'
											: 'bg-bg border-border hover:border-border-strong'
									)}
								>
									<span className="flex items-center justify-between gap-[18px]">
										<span className="face-display text-[23px] leading-[1.2] font-bold">
											{t(`items.${pain}.q`)}
										</span>
										<span
											aria-hidden
											className={cn(
												'relative h-8 w-14 flex-none rounded-full transition-colors duration-200',
												active ? 'bg-accent' : 'bg-border-strong'
											)}
										>
											<span
												className={cn(
													'bg-surface absolute top-1 left-1 size-6 rounded-full shadow-[0_2px_6px_rgb(0_0_0/0.2)] transition-transform duration-250 ease-(--ease-out) motion-reduce:transition-none',
													active && 'translate-x-6'
												)}
											/>
										</span>
									</span>
									{active ? (
										<span className="text-accent-deep mt-3 block text-[16px] leading-normal motion-safe:animate-[arrive_.5s_var(--ease-out)_both]">
											{t(`items.${pain}.a`)}
										</span>
									) : null}
								</button>
							</li>
						)
					})}
				</ul>
			</div>
		</section>
	)
}
