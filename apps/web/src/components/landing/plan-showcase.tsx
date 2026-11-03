import { getTranslations } from 'next-intl/server'
import { ArrowRightIcon, SpinnerIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

// What setup makes from one goal: the goal as typed, with the answers that
// shape it, then the plan, its milestones down a timeline and its daily
// actions from small to large. Sara's plan from the walkthrough.
const MILESTONES = [
	{ key: 'first', week: 2, dot: 'bg-accent text-accent-ink' },
	{ key: 'second', week: 4, dot: 'bg-accent-soft text-accent-deep' },
	{ key: 'third', week: 6, dot: 'bg-accent-soft text-accent-deep' },
	{ key: 'goal', week: 8, dot: 'bg-coral text-coral-ink' }
] as const
const ACTIONS = ['run', 'shoes', 'stretch'] as const

export async function PlanShowcase() {
	const t = await getTranslations('HomePage.plan')

	return (
		<section
			id="plan"
			aria-labelledby="plan-heading"
			className="mx-auto max-w-[1200px] scroll-mt-16 px-(--page-margin) py-32"
		>
			<div className="mx-auto max-w-[760px] text-center">
				<p
					data-reveal
					className="text-accent text-[14px] font-semibold tracking-[0.08em] uppercase"
				>
					{t('eyebrow')}
				</p>
				<h2
					id="plan-heading"
					data-reveal
					className="face-display text-head mt-3.5 mb-[18px] font-extrabold delay-[70ms]"
				>
					{t('heading')}
				</h2>
				<p data-reveal className="text-text-muted text-[18px] leading-[1.55] delay-[140ms]">
					{t('support')}
				</p>
			</div>

			<div className="mt-14 flex flex-wrap items-stretch gap-5">
				<figure
					data-reveal
					className="bg-night text-night-ink flex min-w-0 flex-[1_1_320px] flex-col gap-5 rounded-[28px] p-8"
				>
					<figcaption className="text-night-muted text-[14px]">{t('goalLabel')}</figcaption>
					<p className="border-night-border bg-night-surface rounded-[14px] border p-4 text-[20px] font-semibold">
						{t('goal')}
					</p>
					<ul className="flex flex-wrap gap-2 text-[13px]">
						<li className="bg-coral text-coral-ink rounded-full px-3 py-[7px] font-semibold">
							{t('tags.weeks')}
						</li>
						<li className="border-night-border rounded-full border px-3 py-[7px]">
							{t('tags.now')}
						</li>
						<li className="border-night-border rounded-full border px-3 py-[7px]">
							{t('tags.obstacle')}
						</li>
					</ul>
					<p className="text-night-muted mt-auto flex items-center gap-3 text-[14px]">
						<SpinnerIcon size={18} className="text-coral" />
						{t('writing')}
					</p>
				</figure>

				<div className="grid min-w-0 flex-[2_1_560px] grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
					<div data-reveal className={cn(panel, 'delay-[80ms]')}>
						<h3 className={panelLabel}>{t('milestonesLabel')}</h3>
						<ol className="mt-5">
							{MILESTONES.map((milestone, index) => (
								<li key={milestone.key} className="flex gap-3.5 pb-[18px]">
									<span className="flex flex-col items-center">
										<span
											className={cn(
												'grid size-[26px] place-items-center rounded-full text-[12px] font-bold',
												milestone.dot
											)}
										>
											{index + 1}
										</span>
										<span aria-hidden className="bg-border mt-1 min-h-4 w-0.5 flex-1" />
									</span>
									<span>
										<span className="text-text-faint block text-[13px]">
											{t('week', { week: milestone.week })}
										</span>
										<span className="mt-0.5 block font-semibold">
											{t(`milestones.${milestone.key}`)}
										</span>
									</span>
								</li>
							))}
						</ol>
					</div>
					<div data-reveal className={cn(panel, 'delay-[160ms]')}>
						<h3 className={panelLabel}>{t('actionsLabel')}</h3>
						<ul className="mt-5 grid gap-3.5">
							{ACTIONS.map((action) => (
								<li key={action} className="bg-bg rounded-2xl p-4">
									<p className="font-semibold">{t(`actions.${action}.small`)}</p>
									<p className="text-text-faint mt-2.5 flex flex-wrap items-center gap-1.5 text-[13px]">
										<span className="bg-accent-soft text-accent-deep rounded-md px-2 py-[3px] font-semibold">
											{t('smallTag')}
										</span>
										<span className="sr-only">{t('sizesLabel')}</span>
										<ArrowRightIcon size={14} />
										<span>{t(`actions.${action}.medium`)}</span>
										<ArrowRightIcon size={14} />
										<span>{t(`actions.${action}.large`)}</span>
									</p>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	)
}

const panel = 'bg-surface border-border rounded-[28px] border p-7'
const panelLabel = 'text-text-faint text-[13px] font-semibold tracking-[0.08em] uppercase'
