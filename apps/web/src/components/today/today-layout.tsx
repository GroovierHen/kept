import { getTranslations } from 'next-intl/server'
import { AsideCard } from '@/components/setup/setup-layout'
import { IN_A_ROW_TO_FORGIVE_AGAIN } from '@kept/contract'
import { CheckIcon, ShieldCheckIcon, ShieldIcon } from '@/components/ui/icons'
import type { CheckInStep } from '@/lib/check-in'
import { cn } from '@/lib/cn'
import type { DayOutcome } from '@/lib/ledger'
import type { Streak } from '@/lib/streak'
import { CountUp } from './count-up'

// The pieces the Today screen lays out inside <AppShell>: the check-in's steps
// down the left, the line and heading over each step, and what the green
// panel beside it carries.

export const CHECK_IN_STEPS = ['report', 'learn', 'commit'] as const

const stepIndex = (step: CheckInStep) =>
	step === 'done' ? CHECK_IN_STEPS.length : CHECK_IN_STEPS.indexOf(step)

export async function CheckInRail({
	step,
	day,
	goal,
	week
}: {
	step: CheckInStep
	day: number
	goal: { text: string; weeks: number }
	week: number
}) {
	const t = await getTranslations('TodayPage.rail')
	const current = stepIndex(step)

	return (
		<nav aria-label={t('label')} className="hidden flex-[0_0_240px] pt-9 lg:block">
			<p className="text-text-faint mb-[18px] text-[12px] font-semibold tracking-[0.08em] uppercase">
				{t('heading', { day })}
			</p>
			<ol className="flex flex-col gap-1.5">
				{CHECK_IN_STEPS.map((name, index) => {
					const isDone = index < current
					const isCurrent = index === current
					return (
						<li
							key={name}
							aria-current={isCurrent ? 'step' : undefined}
							className={cn(
								'flex items-start gap-3 rounded-2xl border px-3.5 py-3',
								isCurrent ? 'border-border bg-surface' : 'border-transparent'
							)}
						>
							<span
								className={cn(
									'grid size-7 flex-none place-items-center rounded-full border-2 text-[13px] font-bold',
									isDone && 'border-accent bg-accent text-accent-ink',
									isCurrent && 'border-accent bg-coral text-coral-ink',
									!isDone && !isCurrent && 'border-border-strong text-text-faint'
								)}
							>
								{isDone ? (
									<>
										<CheckIcon size={14} />
										<span className="sr-only">{t('done')}</span>
									</>
								) : (
									index + 1
								)}
							</span>
							<span className="flex min-w-0 flex-col gap-0.5">
								<span
									className={cn(
										'text-[15px] font-semibold',
										isDone || isCurrent ? 'text-text' : 'text-text-muted'
									)}
								>
									{t(`steps.${name}`)}
								</span>
								<span className="text-text-faint text-[13px] leading-[1.4]">
									{t(`subs.${name}`)}
								</span>
							</span>
						</li>
					)
				})}
			</ol>

			<div className="border-border bg-surface mt-7 rounded-[18px] border p-4">
				<p className="text-text-faint text-[12px] font-semibold tracking-[0.08em] uppercase">
					{t('goal')}
				</p>
				<p className="mt-2 text-[15px] leading-[1.35] font-semibold first-letter:uppercase">
					{goal.text}
				</p>
				<p aria-hidden className="mt-2.5 flex gap-1">
					{Array.from({ length: goal.weeks }, (_, index) => (
						<span
							key={index}
							className={cn(
								'h-1.5 flex-1 rounded-md',
								index < week ? 'bg-accent' : 'bg-border-strong'
							)}
						/>
					))}
				</p>
				<p className="text-text-faint mt-2 text-[13px]">{t('week', { week, weeks: goal.weeks })}</p>
			</div>
		</nav>
	)
}

/** The bars and "Day 2 · Step 1 of 3" over a step. The day is the page's one h1. */
export async function CheckInIntro({ step, day }: { step: CheckInStep; day: number }) {
	const t = await getTranslations('TodayPage')
	const current = stepIndex(step)
	const isDone = step === 'done'

	return (
		<div className="text-text-faint flex items-center gap-1.5 text-[13px] font-medium">
			{!isDone &&
				CHECK_IN_STEPS.map((name, index) => (
					<span
						key={name}
						aria-hidden
						className={cn(
							'h-1.5 rounded-md',
							index === current ? 'w-7' : 'w-4',
							index <= current ? 'bg-accent' : 'bg-border-strong'
						)}
					/>
				))}
			<h1 className={cn('text-[13px] font-medium', !isDone && 'ml-2')}>{t('day', { day })}</h1>
			{!isDone && (
				<span>
					{' · '}
					{t('progress', { current: current + 1, total: CHECK_IN_STEPS.length })}
				</span>
			)}
		</div>
	)
}

/** A promise on a white ticket: when it's for, the sentence, and a stamp at the foot. */
export function PromiseTicket({
	when,
	sentence,
	foot,
	stamp,
	isStamped
}: {
	when: string
	sentence: string
	foot: string
	stamp: string
	isStamped: boolean
}) {
	return (
		<AsideCard className="p-0">
			<div className="px-6 pt-6 pb-5">
				<p className="text-text-faint text-[13px] font-medium">{when}</p>
				<p className="face-display mt-4 text-[clamp(26px,2.4vw,32px)] leading-[1.08] font-extrabold">
					{sentence}
				</p>
			</div>
			<div aria-hidden className="border-border mx-6 border-t-2 border-dashed" />
			<div className="flex items-center justify-between gap-3 px-6 pt-4 pb-[22px]">
				<p className="text-text-muted text-[14px] font-medium">{foot}</p>
				<p
					className={cn(
						'border-accent rounded-full border-[1.5px] px-3 py-1.5 text-[13px] font-bold',
						isStamped ? 'bg-coral text-coral-ink' : 'bg-surface'
					)}
				>
					{stamp}
				</p>
			</div>
		</AsideCard>
	)
}

/** The last few Kept days as marks on the green panel, each told apart by shape as well as fill. */
export async function WeekStrip({
	days,
	summary
}: {
	days: readonly { day: number; outcome: DayOutcome }[]
	summary: string | null
}) {
	const t = await getTranslations('TodayPage.aside.week')

	return (
		<div className="relative">
			<h2 className="mb-3.5 flex items-baseline justify-between gap-3 text-[12px] font-semibold tracking-[0.08em] uppercase opacity-90">
				{t('heading')}
				{summary != null && (
					<span className="text-[14px] font-semibold tracking-normal normal-case">{summary}</span>
				)}
			</h2>
			<ol className="grid grid-cols-7 gap-1.5">
				{days.map(({ day, outcome }) => (
					<li key={day} className="flex flex-col items-center gap-2">
						<DayMark outcome={outcome} />
						<span className="text-[12px] font-semibold opacity-90">
							{t('day', { day })}
							<span className="sr-only">: {t(`outcomes.${outcome}`)}</span>
						</span>
					</li>
				))}
			</ol>
			<ul className="mt-3.5 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px] opacity-90">
				{(['kept', 'partly', 'slipped', 'unreported'] as const).map((outcome) => (
					<li key={outcome} className="flex items-center gap-1.5">
						<DayMark outcome={outcome} size="key" />
						{t(`outcomes.${outcome}`)}
					</li>
				))}
			</ul>
		</div>
	)
}

function DayMark({ outcome, size = 'day' }: { outcome: DayOutcome; size?: 'day' | 'key' }) {
	const isKey = size === 'key'
	return (
		<span
			aria-hidden
			className={cn(
				'grid flex-none place-items-center rounded-full border-2',
				isKey ? 'size-3' : 'aspect-square w-full max-w-[46px]',
				outcome === 'kept' && 'border-coral bg-coral text-accent',
				outcome === 'partly' &&
					'border-coral bg-[linear-gradient(90deg,transparent_50%,var(--coral)_50%)]',
				outcome === 'slipped' && 'border-accent-ink/45',
				(outcome === 'unreported' || outcome === 'noPromise') &&
					'border-accent-ink/45 border-dashed',
				outcome === 'open' && 'border-accent-ink border-dashed'
			)}
		>
			{!isKey && outcome === 'kept' && <CheckIcon size={18} />}
			{!isKey && outcome === 'open' && <span className="text-[16px] font-bold">?</span>}
		</span>
	)
}

/** The next milestone on the green panel, with how long is left. */
export function MilestoneNote({
	heading,
	text,
	due
}: {
	heading: string
	text: string
	due: string
}) {
	return (
		<div className="border-accent-ink/20 bg-accent-ink/10 relative flex items-center justify-between gap-3.5 rounded-[18px] border px-[18px] py-4">
			<div className="min-w-0">
				<h2 className="text-[12px] font-semibold tracking-[0.08em] uppercase opacity-90">
					{heading}
				</h2>
				<p className="mt-2 text-[16px] leading-[1.35] font-semibold">{text}</p>
			</div>
			<p className="bg-coral text-coral-ink flex-none rounded-full px-3 py-1.5 text-[13px] font-bold">
				{due}
			</p>
		</div>
	)
}

// When each part of the Streak card moves on the done step, in ms: the number
// counts once the card has slammed in, then the forgiveness card tilts in and
// its bars fill one after another.
const STREAK_COUNT_DELAY_MS = 700
const IN_A_ROW_FILL_START_S = 1.9
const IN_A_ROW_FILL_STEP_S = 0.18

/**
 * The Streak at the top of the green panel (ADR 0004): how many days, the best,
 * and whether the next Empty day is forgiven, with the way back to forgiveness
 * when it's used. Hidden at 0, so a Streak that ended never shows as lost.
 * `celebrate` plays its entrance, for the done step.
 */
export async function StreakCard({
	streak,
	celebrate
}: {
	streak: Pick<Streak, 'days' | 'best' | 'isForgivenessReady' | 'inARow'>
	celebrate: boolean
}) {
	if (streak.days === 0) return null
	const t = await getTranslations('TodayPage.aside.streak')
	const isReady = streak.isForgivenessReady
	const inARow = Math.min(streak.inARow, IN_A_ROW_TO_FORGIVE_AGAIN)
	const numberSize = 'text-[clamp(72px,6.4vw,96px)]'

	return (
		<div className="relative flex flex-col gap-6">
			<div
				className={cn(
					'[transform-origin:left_bottom] pr-14',
					celebrate && 'motion-safe:animate-[streak-slam_.7s_.5s_cubic-bezier(.2,1.35,.4,1)_both]'
				)}
			>
				<h2 className="text-[12px] font-semibold tracking-[0.08em] uppercase opacity-80">
					{t('heading')}
				</h2>
				<p className="face-display mt-3 flex items-baseline gap-3 leading-[0.9] font-extrabold">
					{celebrate ? (
						<CountUp value={streak.days} delayMs={STREAK_COUNT_DELAY_MS} className={numberSize} />
					) : (
						<span className={cn(numberSize, 'tabular-nums')}>{streak.days}</span>
					)}
					<span className="text-[clamp(26px,2.2vw,32px)]">{t('unit', { days: streak.days })}</span>
				</p>
				<p className="mt-3 text-[15px] leading-normal opacity-85">
					{t('lead', { best: streak.best })}
				</p>
			</div>

			<AsideCard
				className={cn(
					'flex items-center gap-[18px] px-6 py-[22px]',
					celebrate &&
						'motion-safe:animate-[streak-tilt-in_1s_1.2s_cubic-bezier(.2,1.25,.4,1)_both]'
				)}
			>
				<span
					aria-hidden
					className={cn(
						'flex-none rounded-2xl',
						isReady && 'motion-safe:animate-[streak-glow_1.6s_ease-out_1.8s_infinite]'
					)}
				>
					<span
						className={cn(
							'border-accent text-accent grid size-14 place-items-center rounded-2xl border-2',
							isReady ? 'bg-coral' : 'bg-surface border-dashed',
							celebrate && 'motion-safe:animate-[streak-wobble_.9s_1.7s_ease-in-out_both]'
						)}
					>
						{isReady ? <ShieldCheckIcon size={28} /> : <ShieldIcon size={28} />}
					</span>
				</span>
				<div className="min-w-0 flex-1">
					<p className="face-display text-[21px] leading-[1.2] font-bold">
						{isReady ? t('safe') : t('notSafe')}
					</p>
					{!isReady && (
						<p className="text-text-muted mt-2.5 flex items-center gap-2 text-[13px] font-semibold">
							<span aria-hidden className="flex gap-[5px]">
								{Array.from({ length: IN_A_ROW_TO_FORGIVE_AGAIN }, (_, index) => (
									<span
										key={index}
										className="border-accent h-2 w-[22px] overflow-hidden rounded-md border-2"
									>
										{index < inARow && (
											<span
												className={cn(
													'bg-accent block h-full origin-left',
													celebrate &&
														'motion-safe:animate-[grow-x_.45s_cubic-bezier(.2,1.3,.4,1)_both]'
												)}
												style={{
													animationDelay: `${IN_A_ROW_FILL_START_S + index * IN_A_ROW_FILL_STEP_S}s`
												}}
											/>
										)}
									</span>
								))}
							</span>
							{t('inARow', { count: inARow, total: IN_A_ROW_TO_FORGIVE_AGAIN })}
						</p>
					)}
				</div>
			</AsideCard>
		</div>
	)
}
