'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'

// "Where does your money go?" from setup, as bands that switch on. Each band
// is one of Sara's spends; switched on, it fills with colour and says what the
// promise against it is worth, priced the way the promise coach prices it.
const SPENDS = [
	{ key: 'takeaway', yearly: 1900, field: 'bg-field-1 text-field-1-ink', knob: 'bg-field-1' },
	{ key: 'coffee', yearly: 650, field: 'bg-field-2 text-field-2-ink', knob: 'bg-field-2' },
	{ key: 'subscriptions', yearly: 240, field: 'bg-field-3 text-field-3-ink', knob: 'bg-field-3' },
	// Moving money on payday saves nothing by itself: it locks in the month,
	// so it adds nothing to the total.
	{ key: 'payday', yearly: 0, field: 'bg-field-4 text-field-4-ink', knob: 'bg-field-4' }
] as const

type SpendKey = (typeof SPENDS)[number]['key']

const pounds = new Intl.NumberFormat('en-GB', {
	style: 'currency',
	currency: 'GBP',
	maximumFractionDigits: 0
})

export function SpendSwitches() {
	const t = useTranslations('HomePage.spends')
	const id = useId()
	const [on, setOn] = useState<ReadonlySet<SpendKey>>(() => new Set(['takeaway', 'coffee']))

	const toggle = (key: SpendKey) =>
		setOn((current) => {
			const next = new Set(current)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})

	const total = SPENDS.reduce((sum, spend) => (on.has(spend.key) ? sum + spend.yearly : sum), 0)

	return (
		<section aria-labelledby={`${id}-heading`} className="py-28 md:py-44">
			<div className="mb-12 grid gap-6 px-(--page-margin) md:mb-16 md:grid-cols-12 md:gap-(--gutter)">
				<h2
					id={`${id}-heading`}
					data-reveal
					className="text-head font-medium tracking-[-0.05em] md:col-span-7"
				>
					{t('heading')}
				</h2>
				<p
					data-reveal
					className="text-body max-w-[40ch] delay-[90ms] md:col-span-4 md:col-start-9 md:self-end"
				>
					{t('support')}
				</p>
			</div>

			<ul data-ui>
				{SPENDS.map((spend) => {
					const active = on.has(spend.key)
					const labelId = `${id}-${spend.key}`
					return (
						<li
							key={spend.key}
							className={cn(
								'transition-colors duration-300',
								active ? spend.field : 'text-text-muted'
							)}
						>
							<div className="grid min-h-33 grid-cols-[1fr_auto] items-center gap-x-6 px-(--page-margin) py-6 md:min-h-[20vh] md:grid-cols-12 md:gap-x-(--gutter)">
								<div className="md:col-span-10">
									<h3
										id={labelId}
										className="text-lead md:text-head font-medium tracking-[-0.04em] md:leading-[1.05]"
									>
										{t(`${spend.key}.sentence`)}
									</h3>
									{active ? <p className="text-body mt-2">{t(`${spend.key}.result`)}</p> : null}
								</div>
								<button
									type="button"
									role="switch"
									aria-checked={active}
									aria-labelledby={labelId}
									onClick={() => toggle(spend.key)}
									className="group flex min-h-11 min-w-11 items-center justify-center justify-self-end rounded-full md:col-span-2"
								>
									<span
										className={cn(
											'text-head relative flex h-[1.1em] w-[2em] items-center rounded-full p-[0.12em] transition-colors duration-200',
											'outline-current group-focus-visible:outline-2 group-focus-visible:outline-offset-4',
											active ? 'bg-current' : 'border-[0.06em] border-current'
										)}
									>
										<span
											className={cn(
												'block size-[0.8em] rounded-full transition-transform duration-300 ease-(--ease-out) motion-reduce:transition-none',
												active ? cn(spend.knob, 'translate-x-[0.9em]') : 'bg-current'
											)}
										/>
									</span>
								</button>
							</div>
						</li>
					)
				})}
			</ul>

			<p
				aria-live="polite"
				className="text-lead mt-12 px-(--page-margin) font-medium tracking-[-0.03em] md:mt-16"
			>
				{total > 0 ? t('total', { amount: pounds.format(total) }) : t('none')}
			</p>
		</section>
	)
}
