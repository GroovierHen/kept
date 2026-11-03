'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CheckIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

// One check-in on the Today screen, shown a step at a time: report, learn,
// promise, ledger. It moves on by itself every few seconds, and holds still
// while the pointer or focus is on it, once someone picks a step from the bars
// along the top, or for anyone who asks for reduced motion.
const STEPS = ['report', 'learn', 'promise', 'ledger'] as const
const STEP_MS = 3200

// Sara's week in the walkthrough: a Partly on Monday, Yeses through
// Saturday, Sunday not reported yet.
const WEEK = ['bg-partly', 'bg-kept', 'bg-kept', 'bg-kept', 'bg-kept', 'bg-kept', 'bg-border']
// 1 Jan 2024 was a Monday.
const MONDAY = Date.UTC(2024, 0, 1)
const DAY_MS = 86_400_000

export function HeroReel() {
	const t = useTranslations('HomePage.hero.reel')
	const locale = useLocale()
	const [step, setStep] = useState(0)
	const [held, setHeld] = useState(false)
	const [picked, setPicked] = useState(false)

	useEffect(() => {
		if (held || picked || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
		const timer = window.setInterval(
			() => setStep((current) => (current + 1) % STEPS.length),
			STEP_MS
		)
		return () => window.clearInterval(timer)
	}, [held, picked])

	const weekday = new Intl.DateTimeFormat(locale, { weekday: 'narrow', timeZone: 'UTC' })
	const current = STEPS[step]

	return (
		<figure
			aria-label={t('label')}
			onPointerEnter={() => setHeld(true)}
			onPointerLeave={() => setHeld(false)}
			onFocus={() => setHeld(true)}
			onBlur={() => setHeld(false)}
			className="bg-surface relative w-[360px] max-w-full rounded-[28px] p-[26px] shadow-[0_40px_80px_-30px_var(--shadow)]"
		>
			<p className="text-text-faint flex items-center justify-between text-[13px] font-medium">
				<span>{t('day')}</span>
				<span className="text-text flex items-center gap-1.5 font-semibold">
					<span aria-hidden className="bg-coral size-2 rounded-full" />
					{t('streak')}
				</span>
			</p>
			<div className="mt-4 grid grid-cols-4 gap-1.5">
				{STEPS.map((name, index) => (
					<button
						key={name}
						type="button"
						aria-label={t('show', { number: index + 1, name: t(`${name}.step`) })}
						aria-current={index === step ? 'step' : undefined}
						onClick={() => {
							setPicked(true)
							setStep(index)
						}}
						className="group -my-5 flex h-11 items-center rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<span className="bg-border h-[5px] w-full overflow-hidden rounded-[5px]">
							<span
								className={cn(
									'bg-accent block h-full transition-[width] duration-500 ease-out',
									index <= step ? 'w-full' : 'w-0'
								)}
							/>
						</span>
					</button>
				))}
			</div>

			<div
				key={current}
				className="mt-[22px] min-h-[300px] motion-safe:animate-[arrive_.5s_var(--ease-out)_both]"
			>
				<p className="text-accent text-[12px] font-semibold tracking-[0.08em] uppercase">
					{step + 1} · {t(`${current}.step`)}
				</p>
				{current === 'report' ? (
					<>
						<p className={sentence}>{t('report.question')}</p>
						<div className="mt-[22px] grid gap-2.5">
							<span className="bg-kept-soft border-success flex items-center justify-between rounded-[14px] border-2 px-4 py-3.5 font-semibold motion-safe:animate-[pop_.5s_var(--ease-out)_both]">
								{t('report.yes')}
								<CheckIcon size={20} className="text-success" />
							</span>
							<span className={option}>{t('report.partly')}</span>
							<span className={option}>{t('report.no')}</span>
						</div>
					</>
				) : null}
				{current === 'learn' ? (
					<>
						<p className={sentence}>{t('learn.idea')}</p>
						<p className="text-text-muted mt-3.5 text-[15px] leading-[1.55]">{t('learn.why')}</p>
						<p className="bg-bg text-text-muted mt-[18px] rounded-[14px] px-4 py-3.5 text-[14px] leading-normal">
							{t('learn.answer')}
						</p>
						<p className="bg-accent-soft text-accent-deep mt-3 inline-flex rounded-full px-3 py-[7px] text-[13px] font-semibold motion-safe:animate-[pop_.5s_var(--ease-out)_both]">
							{t('learn.mark')}
						</p>
					</>
				) : null}
				{current === 'promise' ? (
					<>
						<p className={sentence}>{t('promise.sentence')}</p>
						<p className="mt-[18px] flex flex-wrap gap-2 text-[13px]">
							<span className="bg-bg text-text-faint rounded-full px-2.5 py-1.5">
								{t('promise.small')}
							</span>
							<span className="bg-night text-night-ink rounded-full px-2.5 py-1.5 font-semibold motion-safe:animate-[pop_.5s_var(--ease-out)_both]">
								{t('promise.medium')}
							</span>
							<span className="bg-bg text-text-faint rounded-full px-2.5 py-1.5">
								{t('promise.large')}
							</span>
						</p>
						<p className="bg-accent text-accent-ink mt-[22px] rounded-[14px] px-4 py-3.5 text-center font-semibold">
							{t('promise.button')}
						</p>
						<p className="text-text-faint mt-2.5 text-center text-[13px]">
							{t('promise.reminder')}
						</p>
					</>
				) : null}
				{current === 'ledger' ? (
					<>
						<p className={sentence}>{t('ledger.sentence')}</p>
						<ul aria-hidden className="mt-[18px] grid grid-cols-7 gap-1.5">
							{WEEK.map((fill, index) => (
								<li
									key={index}
									className="text-text-faint grid justify-items-center gap-1.5 text-[11px]"
								>
									<span
										className={cn(
											'size-[34px] rounded-[10px] motion-safe:animate-[pop_.5s_var(--ease-out)_both]',
											fill
										)}
										style={{ animationDelay: `${index * 70}ms` }}
									/>
									{weekday.format(new Date(MONDAY + index * DAY_MS))}
								</li>
							))}
						</ul>
						<dl className="mt-5 text-[14px]">
							<div className="border-border flex justify-between border-t py-3">
								<dt>{t('ledger.credits')}</dt>
								<dd className="text-success font-bold">{t('ledger.creditsValue')}</dd>
							</div>
							<div className="border-border flex justify-between border-t py-3">
								<dt>{t('ledger.debits')}</dt>
								<dd className="text-danger font-bold">{t('ledger.debitsValue')}</dd>
							</div>
						</dl>
					</>
				) : null}
			</div>
		</figure>
	)
}

const sentence = 'face-display mt-2.5 text-[27px] leading-[1.15] font-bold'
const option = 'border-border text-text-muted rounded-[14px] border px-4 py-3.5 font-medium'
