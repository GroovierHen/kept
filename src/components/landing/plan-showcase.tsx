'use client'

import { useId, useState } from 'react'
import { useTranslations } from 'next-intl'

// What Kept builds from a goal, shown on three example goals the visitor can
// switch between. They are written out, not made live: the AI writes a plan
// only after sign-up, so a visitor can't run up its bill from the home page.
const EXAMPLES = ['run', 'cook', 'guitar'] as const
const ROWS = ['goal', 'milestone', 'promise', 'idea'] as const

type Example = (typeof EXAMPLES)[number]

export function PlanShowcase() {
	const t = useTranslations('HomePage.plan')
	const [example, setExample] = useState<Example>('run')
	const id = useId()

	return (
		<section
			id="plan"
			aria-labelledby={`${id}-heading`}
			className="bg-surface flex min-h-[88svh] scroll-mt-8 flex-col px-(--page-margin) py-24 md:py-36"
		>
			<h2
				id={`${id}-heading`}
				data-reveal
				className="text-head mb-6 max-w-[18ch] font-medium tracking-[-0.05em]"
			>
				{t('heading')}
			</h2>
			<p data-reveal className="text-body md:text-lead mb-10 max-w-[48ch] delay-[60ms]">
				{t('support')}
			</p>

			<div data-ui data-reveal className="flex flex-col gap-6 delay-[90ms]">
				<div className="flex flex-wrap items-center gap-2">
					<p className="text-small text-text-muted mr-2">{t('examplesLabel')}</p>
					{EXAMPLES.map((key) => (
						<button
							key={key}
							type="button"
							onClick={() => setExample(key)}
							aria-pressed={example === key}
							aria-controls={`${id}-plan`}
							className="text-body bg-bg aria-pressed:bg-field-1 aria-pressed:text-field-1-ink hover:bg-surface-hover flex h-11 items-center rounded px-4 transition-[background-color,color,transform] duration-200 active:scale-[0.97]"
						>
							{t(`examples.${key}.label`)}
						</button>
					))}
				</div>

				<dl
					id={`${id}-plan`}
					aria-live="polite"
					className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4"
				>
					{ROWS.map((row) => (
						<div key={row} className="bg-bg flex flex-col gap-2 rounded px-4 py-4 md:px-5 md:py-5">
							<dt className="text-small text-text-muted">{t(`rows.${row}`)}</dt>
							<dd className="text-lead font-medium tracking-[-0.03em]">
								{t(`examples.${example}.${row}`)}
							</dd>
						</div>
					))}
				</dl>
			</div>

			<p className="text-body text-text-muted mt-auto max-w-[60ch] pt-14">{t('note')}</p>
		</section>
	)
}
