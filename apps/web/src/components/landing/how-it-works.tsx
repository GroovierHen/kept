import { getTranslations } from 'next-intl/server'
import { ClockIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { StepStack } from './step-stack'

// The four parts of a day with Kept, one card each, every card with the piece
// of the Today screen it describes beside it. Each card has its own ground so
// the stack reads as four things: white, night, soft green, green.
const STEPS = ['report', 'learn', 'promise', 'keep'] as const
type Step = (typeof STEPS)[number]

const LOOK: Record<
	Step,
	{ card: string; number: string; chip: string; body: string; panel: string }
> = {
	report: {
		card: 'bg-surface border-border border shadow-[0_30px_60px_-40px_var(--shadow)]',
		number: 'text-coral opacity-40',
		chip: 'bg-coral-soft text-coral-deep',
		body: 'text-text-muted',
		panel: 'bg-bg'
	},
	learn: {
		card: 'bg-night text-night-ink shadow-[0_30px_60px_-30px_var(--shadow)]',
		number: 'text-night-border',
		chip: 'bg-night-border text-night-ink',
		body: 'text-night-muted',
		panel: 'bg-night-surface border-night-border border'
	},
	promise: {
		card: 'bg-accent-soft border-border-strong border shadow-[0_30px_60px_-40px_var(--shadow)]',
		number: 'text-border-strong',
		chip: 'bg-surface text-accent-deep',
		body: 'text-text',
		panel: 'bg-surface'
	},
	keep: {
		card: 'bg-accent text-accent-ink shadow-[0_30px_60px_-30px_var(--shadow)]',
		number: 'text-accent-ink opacity-25',
		chip: 'bg-surface text-accent-deep',
		body: 'text-accent-ink opacity-85',
		panel: 'bg-surface text-text'
	}
}

export async function HowItWorks() {
	const t = await getTranslations('HomePage.how')

	const panels: Record<Step, React.ReactNode> = {
		report: (
			<>
				<p className={panelSentence}>{t('report.question')}</p>
				<div className="mt-[18px] grid grid-cols-3 gap-2.5 text-center">
					<span className="bg-kept-soft border-success rounded-2xl border-2 px-3 py-[18px] font-bold">
						{t('report.yes')}
					</span>
					<span className={answer}>{t('report.partly')}</span>
					<span className={answer}>{t('report.no')}</span>
				</div>
				<p className="bg-surface text-text-muted mt-3.5 rounded-xl px-3.5 py-3 text-[14px]">
					{t('report.result')}
				</p>
			</>
		),
		learn: (
			<>
				<p className="text-coral text-[12px] font-semibold tracking-[0.08em] uppercase">
					{t('learn.label')}
				</p>
				<p className={cn(panelSentence, 'mt-2.5')}>{t('learn.idea')}</p>
				<p className="bg-night border-night-border text-night-muted mt-4 rounded-[14px] border px-4 py-3.5 text-[15px] leading-normal">
					{t('learn.answer')}
				</p>
				<p className="mt-3.5 flex items-center gap-2.5">
					<span className="bg-kept text-kept-ink rounded-[10px] px-2.5 py-1.5 font-extrabold">
						{t('learn.mark')}
					</span>
					<span className="text-night-muted text-[14px]">{t('learn.markText')}</span>
				</p>
			</>
		),
		promise: (
			<>
				<ul className="grid grid-cols-2 gap-2 text-center text-[14px] font-semibold">
					{(['wake', 'lunch', 'work', 'bed'] as const).map((moment) => (
						<li
							key={moment}
							className={cn(
								'rounded-xl p-3',
								moment === 'work' ? 'bg-night text-night-ink' : 'border-border border'
							)}
						>
							{t(`promise.moments.${moment}`)}
						</li>
					))}
				</ul>
				<p className={cn(panelSentence, 'mt-[18px]')}>{t('promise.sentence')}</p>
				<p className="bg-accent text-accent-ink mt-4 rounded-[14px] p-3.5 text-center font-semibold">
					{t('promise.button')}
				</p>
			</>
		),
		keep: (
			<>
				<p className="flex items-center gap-3">
					<span className="bg-coral-soft text-coral-deep grid size-10 place-items-center rounded-xl">
						<ClockIcon size={20} />
					</span>
					<span>
						<span className="block font-bold">{t('keep.reminder')}</span>
						<span className="text-text-faint block text-[13px]">{t('keep.reminderWhen')}</span>
					</span>
				</p>
				<div aria-hidden className="mt-5 grid grid-cols-7 gap-1.5">
					{['bg-partly', 'bg-kept', 'bg-kept', 'bg-kept', 'bg-kept', 'bg-kept', 'bg-border'].map(
						(fill, index) => (
							<span key={index} className={cn('aspect-square rounded-[9px]', fill)} />
						)
					)}
				</div>
				<p className="mt-3.5 flex justify-between text-[14px]">
					<span>{t('keep.week')}</span>
					<strong className="text-success">{t('keep.weekValue')}</strong>
				</p>
			</>
		)
	}

	const cards = STEPS.map((step, index) => {
		const look = LOOK[step]
		return (
			<article
				key={step}
				className={cn(
					'relative flex h-full flex-wrap items-center gap-8 overflow-hidden rounded-[32px] p-[clamp(24px,4vw,48px)]',
					look.card
				)}
			>
				{step === 'keep' ? (
					<div aria-hidden className="dot-grid absolute inset-0 opacity-85" />
				) : null}
				<div className="relative min-w-0 flex-[1_1_340px]">
					<p className="flex items-center gap-3">
						<span
							aria-hidden
							className={cn('face-display text-[64px] leading-none font-extrabold', look.number)}
						>
							{String(index + 1).padStart(2, '0')}
						</span>
						<span className={cn('rounded-full px-3 py-1.5 text-[13px] font-semibold', look.chip)}>
							{t(`${step}.time`)}
						</span>
					</p>
					<h3 className="face-display text-title mt-[18px] mb-3.5 font-extrabold">
						{t(`${step}.title`)}
					</h3>
					<p className={cn('max-w-[460px] text-[18px] leading-[1.6]', look.body)}>
						{t(`${step}.body`)}
					</p>
				</div>
				<div
					aria-hidden
					className={cn(
						'relative hidden min-w-0 flex-[1_1_340px] rounded-3xl p-7 md:block',
						look.panel
					)}
				>
					{panels[step]}
				</div>
			</article>
		)
	})

	return (
		<StepStack
			eyebrow={t('eyebrow')}
			heading={t('heading')}
			stepsLabel={t('stepsLabel')}
			labels={STEPS.map((step) => t(`${step}.nav`))}
			hint={t('hint')}
			hintLast={t('hintLast')}
			cards={cards}
		/>
	)
}

const panelSentence = 'face-display text-[24px] leading-[1.2] font-bold'
const answer =
	'bg-surface border-border text-text-muted rounded-2xl border px-3 py-[18px] font-semibold'
