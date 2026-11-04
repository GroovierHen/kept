import type { Metadata } from 'next'
import { getFormatter, getLocale, getTranslations } from 'next-intl/server'
import { Link, redirect } from '@/i18n/routing'
import { AsideCard, SetupAside } from '@/components/setup/setup-layout'
import { SETUP_SECONDARY_BUTTON } from '@/components/setup/setup-styles'
import { AppShell } from '@/components/today/app-shell'
import { DayByDay } from '@/components/today/day-by-day'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, ChevronLeftIcon } from '@/components/ui/icons'
import { cn } from '@/lib/cn'
import { dayNumber, type KeptDay } from '@/lib/kept-day'
import { dayOutcomes } from '@/lib/ledger'
import { getSignedInUser } from '@/server/auth/session'
import { readSetupStep } from '@/server/setup/progress'
import { readLedger } from '@/server/today/read-ledger'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('LedgerPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

const OUTCOMES = ['kept', 'partly', 'slipped'] as const
const SIZE_DIRECTIONS = ['bigger', 'smaller'] as const
const MAX_SCORE = 2
const WEEK_DAYS = 7

const SECTION_HEADING = 'mb-3.5 text-[16px] font-semibold'
const PANEL = 'border-border bg-surface rounded-[22px] border'

// One tap from the Today screen: what the user has kept, built from their Events.
export default async function LedgerPage() {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })
	if ((await readSetupStep(user.id)) != null) {
		return redirect({ href: '/setup', locale })
	}

	const [
		{
			today,
			signUpDay,
			promises,
			goal,
			milestones,
			ledger,
			actions,
			milestone,
			recallProgress,
			streak
		},
		t,
		tPromise,
		format
	] = await Promise.all([
		readLedger(user.id),
		getTranslations('LedgerPage'),
		getTranslations('SetupPage.promise'),
		getFormatter()
	])
	const dayOf = (day: KeptDay) => dayNumber({ signUpDay, today: day })
	const currentDay = dayOf(today)
	const { week } = ledger

	const promiseOn = new Map(promises.map((promise) => [promise.promiseDay, promise]))
	const days = dayOutcomes({
		ledger,
		promiseDays: promises.map(({ promiseDay }) => promiseDay),
		from: signUpDay,
		today
	}).map(({ day, outcome }) => {
		const promise = promiseOn.get(day)
		return {
			day: dayOf(day),
			label: t('days.day', { day: dayOf(day) }),
			outcome,
			outcomeLabel: t(`days.outcomes.${outcome}`),
			sentence:
				promise == null
					? null
					: tPromise(`sentences.${promise.moment}`, { wording: promise.wording })
		}
	})

	const sizeRows = SIZE_DIRECTIONS.map((direction) => ({
		direction,
		rows: ledger.sizeChanges.flatMap((change) => {
			const action = actions.find(({ id }) => id === change.actionId)
			return change.direction === direction && action != null
				? [{ ...change, wording: action.sizes[change.to] }]
				: []
		})
	})).filter(({ rows }) => rows.length > 0)

	return (
		<AppShell current="ledger">
			<main className="flex max-w-[820px] min-w-0 flex-[999_1_560px] flex-col pt-2 lg:pt-9">
				<p className="text-text-faint text-[13px] font-medium">
					{t('eyebrow', { day: currentDay })} ·{' '}
					<span className="first-letter:uppercase">{goal.text}</span>
				</p>
				<h1 className="face-display mt-[18px] mb-3.5 text-[clamp(38px,4.4vw,58px)] leading-none font-extrabold">
					{t('title')}
				</h1>
				<p className="text-text-muted max-w-[56ch] text-[17px] leading-[1.55]">{t('lead')}</p>

				<section aria-labelledby="ledger-promises" className="mt-9">
					<h2 id="ledger-promises" className={SECTION_HEADING}>
						{t('promises.title')}
					</h2>
					<dl className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]">
						{OUTCOMES.map((outcome) => {
							const outcomeDays = ledger[outcome]
							const isKept = outcome === 'kept'
							return (
								<div
									key={outcome}
									className={cn(
										'flex flex-col gap-2.5 rounded-[22px] p-[22px]',
										isKept ? 'bg-accent text-accent-ink' : 'border-border bg-surface border'
									)}
								>
									<dt className="flex items-center gap-2 text-[14px] font-semibold">
										<OutcomeDot outcome={outcome} />
										{t(`promises.${outcome}`)}
									</dt>
									<dd className="face-display text-[72px] leading-[0.9] font-extrabold">
										{outcomeDays.length}
									</dd>
									{outcomeDays.length > 0 && (
										<dd
											className={cn(
												'text-[13px] leading-[1.45]',
												isKept ? 'text-accent-ink/85' : 'text-text-muted'
											)}
										>
											{t('promises.days', {
												count: outcomeDays.length,
												days: format.list(outcomeDays.map((day) => String(dayOf(day))))
											})}
										</dd>
									)}
								</div>
							)
						})}
					</dl>
					<p className="text-text-muted mt-3 text-[14px] leading-normal">{t('promises.note')}</p>
				</section>

				<section aria-labelledby="ledger-days" className={cn(PANEL, 'mt-9 rounded-3xl p-6')}>
					<div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
						<h2 id="ledger-days" className="text-[16px] font-semibold">
							{t('days.title')}
						</h2>
						<p className="text-text-faint text-[13px]">{t('days.hint')}</p>
					</div>
					<DayByDay days={days} noPromise={t('days.none')} />
				</section>

				{sizeRows.length > 0 && (
					<section aria-labelledby="ledger-sizes" className="mt-9">
						<h2 id="ledger-sizes" className={SECTION_HEADING}>
							{t('sizes.title')}
						</h2>
						<div className="grid gap-3 sm:grid-cols-2">
							{sizeRows.map(({ direction, rows }) => (
								<div key={direction} className={cn(PANEL, 'flex flex-col gap-4 p-5')}>
									<h3
										className={cn(
											'flex items-center gap-2 text-[14px] font-semibold',
											direction === 'bigger' ? 'text-accent' : 'text-text-muted'
										)}
									>
										<ArrowRightIcon
											size={18}
											className={direction === 'bigger' ? '-rotate-45' : 'rotate-45'}
										/>
										{t(`sizes.${direction}`)}
									</h3>
									<ul className="flex flex-col gap-4">
										{rows.map(({ actionId, wording, from, to, promiseDay }) => (
											<li key={actionId} className="flex flex-col gap-2">
												<p className="text-[16px] leading-[1.4] font-semibold first-letter:uppercase">
													{wording}
												</p>
												<p className="text-text-muted flex flex-wrap items-center gap-2 text-[13px]">
													<span className="border-border rounded-full border px-2.5 py-0.5 first-letter:uppercase">
														{t(`sizes.names.${from}`)}
													</span>
													<ArrowRightIcon size={14} className="text-accent" />
													<span
														className={cn(
															'rounded-full px-2.5 py-0.5 font-semibold first-letter:uppercase',
															direction === 'bigger' ? 'bg-coral text-coral-ink' : 'bg-bg text-text'
														)}
													>
														{t(`sizes.names.${to}`)}
													</span>
													{t('sizes.onDay', { day: dayOf(promiseDay) })}
												</p>
											</li>
										))}
									</ul>
									{direction === 'smaller' && (
										<p className="text-text-faint mt-auto text-[13px] leading-normal">
											{t('sizes.smallerNote')}
										</p>
									)}
								</div>
							))}
						</div>
					</section>
				)}

				<section aria-labelledby="ledger-learned" className="mt-9">
					<h2 id="ledger-learned" className={SECTION_HEADING}>
						{t('learned.title')}
					</h2>
					{recallProgress.ideas.length > 0 ? (
						<ul className={cn(PANEL, 'divide-border divide-y overflow-hidden')}>
							{recallProgress.ideas.map(({ keyIdeaId, title, first, last }) => (
								<li
									key={keyIdeaId}
									className="flex flex-wrap items-center justify-between gap-[18px] px-[22px] py-[18px]"
								>
									<div className="min-w-0 flex-[1_1_240px]">
										<p className="text-[16px] font-semibold">{title}</p>
										<p className="text-text-muted mt-1 text-[13px]">
											{t('learned.scores', {
												firstScore: first.score,
												firstDay: dayOf(first.keptDay),
												lastScore: last.score,
												lastDay: dayOf(last.keptDay)
											})}
										</p>
									</div>
									<div aria-hidden className="flex flex-none items-center gap-3">
										<ScorePips score={first.score} />
										<ArrowRightIcon size={16} className="text-accent" />
										<ScorePips score={last.score} />
									</div>
								</li>
							))}
						</ul>
					) : (
						recallProgress.leftOut === 0 && (
							<p className="text-text-muted text-[15px]">{t('learned.none')}</p>
						)
					)}
					{recallProgress.leftOut > 0 && (
						<p className="text-text-muted mt-3 text-[14px]">
							{t('learned.leftOut', { count: recallProgress.leftOut })}
						</p>
					)}
				</section>

				<Button
					asChild
					variant="outline"
					className={cn(SETUP_SECONDARY_BUTTON, 'bg-surface mt-8 self-start')}
				>
					<Link href="/today">
						<ChevronLeftIcon size={18} />
						{t('backToToday')}
					</Link>
				</Button>
			</main>

			<SetupAside
				label={t('aside.label')}
				lead={
					week.total > 0 ? t('week.kept', { kept: week.kept, total: week.total }) : t('week.none')
				}
			>
				{week.total > 0 && (
					<div className="relative flex flex-col gap-3">
						<div aria-hidden className="bg-accent-ink/15 h-3.5 overflow-hidden rounded-full">
							<div
								className="bg-coral h-full rounded-full"
								style={{ width: `${(week.kept / week.total) * 100}%` }}
							/>
						</div>
						<p className="text-accent-ink/85 text-[14px] leading-normal">{t('aside.lead')}</p>
					</div>
				)}

				{milestone != null && (
					<AsideCard>
						<p className="text-text-faint flex flex-wrap items-center justify-between gap-3 text-[13px] font-medium">
							{t('milestone.heading', { week: milestone.week })}
							<span className="bg-coral text-coral-ink rounded-full px-2.5 py-1 font-bold">
								{t('milestone.due', { days: milestone.daysLeft })}
							</span>
						</p>
						<p className="face-display mt-3.5 text-[clamp(26px,2.4vw,32px)] leading-[1.08] font-extrabold">
							{milestone.text}
						</p>
						<ol aria-label={t('milestone.all')} className="mt-5 flex flex-col">
							{milestones.map(({ id, week: due, text }, index) => {
								const isNext = due === milestone.week
								const isPast = due * WEEK_DAYS < currentDay
								return (
									<li key={id} className="flex gap-3">
										<span aria-hidden className="flex w-3.5 flex-none flex-col items-center">
											<span
												className={cn(
													'border-accent size-3.5 rounded-full border-2',
													isNext && 'bg-coral',
													isPast && 'bg-accent'
												)}
											/>
											{index < milestones.length - 1 && (
												<span className="bg-border min-h-4 w-0.5 flex-1" />
											)}
										</span>
										<span
											className={cn(
												'pb-3 text-[14px] leading-[1.2]',
												isNext ? 'font-semibold' : 'text-text-muted'
											)}
										>
											<span className="text-text-faint font-medium">
												{t('milestone.week', { week: due })} ·{' '}
											</span>
											{text}
										</span>
									</li>
								)
							})}
						</ol>
					</AsideCard>
				)}

				<dl className="relative grid grid-cols-2 gap-2.5">
					<div className="border-accent-ink/20 bg-accent-ink/10 rounded-[18px] border p-4">
						<dt className="text-[12px] font-semibold tracking-[0.08em] uppercase opacity-90">
							{t('stats.daysIn')}
						</dt>
						<dd className="face-display mt-2 text-[28px] font-extrabold">
							{currentDay}{' '}
							<span className="font-sans text-[14px] font-medium opacity-90">
								{t('stats.daysOf', { total: goal.weeks * WEEK_DAYS })}
							</span>
						</dd>
					</div>
					<div className="border-accent-ink/20 bg-accent-ink/10 rounded-[18px] border p-4">
						<dt className="text-[12px] font-semibold tracking-[0.08em] uppercase opacity-90">
							{t('stats.recalled')}
						</dt>
						<dd className="face-display mt-2 text-[28px] font-extrabold">
							{recallProgress.ideas.length}{' '}
							<span className="font-sans text-[14px] font-medium opacity-90">
								{t('stats.recalledOf')}
							</span>
						</dd>
					</div>
					<div className="border-accent-ink/20 bg-accent-ink/10 rounded-[18px] border p-4">
						<dt className="text-[12px] font-semibold tracking-[0.08em] uppercase opacity-90">
							{t('stats.streak')}
						</dt>
						<dd className="face-display mt-2 text-[28px] font-extrabold">
							{/* A Streak that ended is never shown as lost (ADR 0004). */}
							{streak.days > 0 ? streak.days : streak.best}{' '}
							<span className="font-sans text-[14px] font-medium opacity-90">
								{streak.days > 0
									? t('stats.streakBest', { best: streak.best })
									: t('stats.streakBestOnly')}
							</span>
						</dd>
					</div>
					<div className="border-accent-ink/20 bg-accent-ink/10 rounded-[18px] border p-4">
						<dt className="text-[12px] font-semibold tracking-[0.08em] uppercase opacity-90">
							{t('stats.comebacks')}
						</dt>
						<dd className="face-display mt-2 text-[28px] font-extrabold">
							{streak.comebacks}{' '}
							<span className="font-sans text-[14px] font-medium opacity-90">
								{t('stats.comebacksOf')}
							</span>
						</dd>
					</div>
				</dl>
			</SetupAside>
		</AppShell>
	)
}

function OutcomeDot({ outcome }: { outcome: (typeof OUTCOMES)[number] }) {
	return (
		<span
			aria-hidden
			className={cn(
				'size-3.5 rounded-full border-2',
				outcome === 'kept' && 'border-coral bg-coral',
				outcome === 'partly' &&
					'border-accent bg-[linear-gradient(90deg,transparent_50%,var(--accent)_50%)]',
				outcome === 'slipped' && 'border-text-faint'
			)}
		/>
	)
}

function ScorePips({ score }: { score: number }) {
	return (
		<span className="flex gap-1">
			{Array.from({ length: MAX_SCORE }, (_, index) => (
				<span
					key={index}
					className={cn(
						'border-accent size-3.5 rounded-full border-2',
						index < score && 'bg-accent'
					)}
				/>
			))}
		</span>
	)
}
