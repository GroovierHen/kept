import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/cn'

// A day with Kept drawn as the product's own progress bar, stretched across
// the page. Each segment's share follows how long that part really takes, so
// the check-in reads as a sliver and keeping the promise as the rest of the day.
const STAGES = [
	{ key: 'report', grow: 'grow-[1.6]', field: 'bg-field-1 text-field-1-ink' },
	{ key: 'learn', grow: 'grow-[3]', field: 'bg-field-2 text-field-2-ink' },
	{ key: 'promise', grow: 'grow-[2.2]', field: 'bg-field-3 text-field-3-ink' },
	{ key: 'day', grow: 'grow-[5]', field: 'bg-field-4 text-field-4-ink' }
] as const

export async function HowItWorks() {
	const t = await getTranslations('HomePage.how')

	return (
		<section id="how" className="scroll-mt-8 px-(--page-margin) py-28 md:py-44">
			<h2 data-reveal className="text-display mb-12 font-medium tracking-[-0.05em] md:mb-16">
				{t('heading')}
			</h2>
			<ol
				data-ui
				aria-label={t('barLabel')}
				className="flex h-[70svh] flex-col gap-1.5 md:h-auto md:flex-row"
			>
				{STAGES.map((stage, index) => (
					<li
						key={stage.key}
						data-reveal
						className={cn(
							'flex basis-0 flex-col gap-3 md:min-w-[12%] md:gap-5',
							stage.grow,
							index === 1 && 'delay-[70ms]',
							index === 2 && 'delay-[140ms]',
							index === 3 && 'delay-[210ms]'
						)}
					>
						<div
							className={cn(
								'flex flex-1 flex-col gap-2 rounded p-4 md:h-[22vh] md:flex-none md:p-5',
								stage.field
							)}
						>
							<p className="text-lead font-medium tracking-[-0.03em]">
								{t(`${stage.key}.duration`)}
							</p>
							<p className="text-body md:hidden">{t(`${stage.key}.clause`)}</p>
						</div>
						<p className="text-body hidden max-w-[22ch] pr-4 md:block">
							{t(`${stage.key}.clause`)}
						</p>
					</li>
				))}
			</ol>
		</section>
	)
}
