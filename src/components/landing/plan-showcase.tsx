'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { parseGoal, splitGoal } from './plan-preview'

const EXAMPLES = [
	{ key: 'safety', goal: '£6,000 in 2 years' },
	{ key: 'holiday', goal: '£1,200 in 12 months' },
	{ key: 'deposit', goal: '£50,000 in 8 years' }
] as const

const pounds = new Intl.NumberFormat('en-GB', {
	style: 'currency',
	currency: 'GBP',
	maximumFractionDigits: 0
})
const pence = new Intl.NumberFormat('en-GB', {
	style: 'currency',
	currency: 'GBP',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
})

function money(value: number): string {
	return Number.isInteger(value) ? pounds.format(value) : pence.format(value)
}

// The home page's live thing: the section's headline is the input. Whatever
// goal the visitor types is split into this year, this month, this week and
// today, the way setup splits Sara's, and the answer updates as they type.
export function PlanShowcase() {
	const t = useTranslations('HomePage.plan')
	const [goal, setGoal] = useState(t('initial'))
	const inputId = useId()
	const parsed = parseGoal(goal)
	const plan = parsed == null ? null : splitGoal(parsed)

	const span =
		parsed == null
			? ''
			: parsed.months % 12 === 0
				? t('years', { count: parsed.months / 12 })
				: t('months', { count: parsed.months })

	const rows =
		plan == null
			? []
			: [
					{ label: t('rows.year'), value: plan.year },
					{ label: t('rows.month'), value: plan.month },
					{ label: t('rows.week'), value: plan.week },
					{ label: t('rows.day'), value: plan.day }
				]

	return (
		<section
			id="plan"
			aria-labelledby={`${inputId}-heading`}
			className="bg-surface flex min-h-[88svh] scroll-mt-8 flex-col px-(--page-margin) py-24 md:py-36"
		>
			<h2
				id={`${inputId}-heading`}
				data-reveal
				className="text-head mb-10 max-w-[18ch] font-medium tracking-[-0.05em]"
			>
				{t('heading')}
			</h2>

			<div data-ui data-reveal className="flex flex-col delay-[90ms]">
				<label htmlFor={inputId} className="sr-only">
					{t('inputLabel')}
				</label>
				<div className="relative flex items-center">
					<input
						id={inputId}
						value={goal}
						onChange={(event) => setGoal(event.target.value)}
						autoComplete="off"
						spellCheck={false}
						className="text-display caret-accent w-full rounded-sm bg-transparent py-2 leading-none font-medium tracking-[-0.05em] outline-none focus-visible:outline-2 focus-visible:outline-offset-8"
					/>
				</div>

				<div aria-live="polite" className="mt-10 md:mt-12">
					{plan == null ? (
						<p className="text-body text-text-muted">{t('hint')}</p>
					) : (
						<>
							<dl className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
								{rows.map((row) => (
									<div
										key={row.label}
										className="bg-bg flex flex-col gap-2 rounded px-4 py-4 md:px-5 md:py-5"
									>
										<dt className="text-small md:text-body text-text-muted">{row.label}</dt>
										<dd className="text-lead md:text-head font-medium tracking-[-0.04em] tabular-nums">
											{money(row.value)}
										</dd>
									</div>
								))}
							</dl>
							{plan.grown == null ? null : (
								<p className="text-body mt-5 max-w-[60ch]">
									{t('growth', {
										total: money(plan.grown.total),
										span,
										interest: money(plan.grown.interest)
									})}
								</p>
							)}
						</>
					)}
				</div>
			</div>

			<div className="mt-auto pt-14">
				<p className="text-small text-text-muted mb-3">{t('examplesLabel')}</p>
				<ul className="flex flex-wrap gap-2 md:gap-x-8">
					{EXAMPLES.map((example) => (
						<li key={example.key}>
							<button
								type="button"
								onClick={() => setGoal(example.goal)}
								aria-pressed={goal === example.goal}
								className="text-body bg-bg aria-pressed:bg-accent aria-pressed:text-accent-ink hover:bg-surface-hover flex h-11 items-center rounded px-4 transition-[background-color,color,transform] duration-200 active:scale-[0.97] md:h-auto md:bg-transparent md:px-0 md:underline md:decoration-transparent md:underline-offset-[0.25em] md:hover:bg-transparent md:hover:decoration-current md:aria-pressed:bg-transparent md:aria-pressed:text-current md:aria-pressed:decoration-current"
							>
								{t(`examples.${example.key}`)}
							</button>
						</li>
					))}
				</ul>
			</div>
		</section>
	)
}
