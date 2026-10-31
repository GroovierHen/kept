import type { Metadata } from 'next'
import { getFormatter, getLocale, getTranslations } from 'next-intl/server'
import { Link, redirect } from '@/i18n/routing'
import { SiteNav } from '@/components/landing/site-nav'
import { Button } from '@/components/ui/button'
import { ProgressBar } from '@/components/ui/progress-bar'
import { StepCard } from '@/components/ui/step-card'
import { dayNumber, type KeptDay } from '@/lib/kept-day'
import { getSignedInUser } from '@/server/auth/session'
import { readSetupStep } from '@/server/setup/stub-progress'
import { readLedger } from '@/server/today/read-ledger'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('LedgerPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

const SIZE_DIRECTIONS = ['bigger', 'smaller'] as const

// One tap from the Today screen: what the user has kept, built from their Events.
export default async function LedgerPage() {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })
	if ((await readSetupStep(user.id)) != null) {
		return redirect({ href: '/setup', locale })
	}

	const [{ signUpDay, ledger, actions, milestone, recallProgress }, t, format] = await Promise.all([
		readLedger(user.id),
		getTranslations('LedgerPage'),
		getFormatter()
	])
	const dayOf = (day: KeptDay) => dayNumber({ signUpDay, today: day })
	const { week } = ledger

	return (
		<div className="flex min-h-svh flex-col">
			<SiteNav />
			<main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-(--page-margin) pb-24">
				<h1 className="text-lead font-medium">{t('title')}</h1>

				<StepCard title={t('promises.title')}>
					<dl className="flex flex-col gap-3">
						{(['kept', 'partly', 'slipped'] as const).map((outcome) => {
							const days = ledger[outcome]
							return (
								<div key={outcome} className="grid grid-cols-[5rem_2rem_1fr] items-baseline gap-2">
									<dt className="text-body">{t(`promises.${outcome}`)}</dt>
									<dd className="text-body font-semibold">{days.length}</dd>
									<dd className="text-small text-text-muted">
										{days.length > 0 &&
											t('promises.days', {
												count: days.length,
												days: format.list(days.map((day) => String(dayOf(day))))
											})}
									</dd>
								</div>
							)
						})}
					</dl>
					<p className="text-small text-text-muted">{t('promises.note')}</p>
				</StepCard>

				{SIZE_DIRECTIONS.map((direction) => {
					const rows = ledger.sizeChanges.flatMap((change) => {
						const action = actions.find(({ id }) => id === change.actionId)
						return change.direction === direction && action != null
							? [{ ...change, wording: action.sizes[change.to] }]
							: []
					})
					if (rows.length === 0) return null
					return (
						<StepCard key={direction} title={t(`sizes.${direction}`)}>
							<ul className="flex flex-col gap-3">
								{rows.map(({ actionId, wording, from, to, promiseDay }) => (
									<li key={actionId} className="flex flex-col gap-1">
										<p className="text-body">{wording}</p>
										<p className="text-small text-text-muted">
											{t('sizes.change', {
												from: t(`sizes.names.${from}`),
												to: t(`sizes.names.${to}`),
												day: dayOf(promiseDay)
											})}
										</p>
									</li>
								))}
							</ul>
						</StepCard>
					)
				})}

				<StepCard title={t('week.title')}>
					{week.total > 0 ? (
						<ProgressBar
							value={week.kept}
							max={week.total}
							label={t('week.kept', { kept: week.kept, total: week.total })}
						/>
					) : (
						<p className="text-small text-text-muted">{t('week.none')}</p>
					)}
				</StepCard>

				{milestone != null && (
					<StepCard title={t('milestone.title')}>
						<div className="flex flex-col gap-1">
							<p className="text-body">{milestone.text}</p>
							<p className="text-small text-text-muted">
								{t('milestone.due', { days: milestone.daysLeft })}
							</p>
						</div>
					</StepCard>
				)}

				<StepCard title={t('learned.title')}>
					{recallProgress.ideas.length > 0 ? (
						<ul className="flex flex-col gap-3">
							{recallProgress.ideas.map(({ keyIdeaId, title, first, last }) => (
								<li key={keyIdeaId} className="flex flex-col gap-1">
									<p className="text-body">{title}</p>
									<p className="text-small text-text-muted">
										{t('learned.scores', {
											firstScore: first.score,
											firstDay: dayOf(first.keptDay),
											lastScore: last.score,
											lastDay: dayOf(last.keptDay)
										})}
									</p>
								</li>
							))}
						</ul>
					) : (
						recallProgress.leftOut === 0 && (
							<p className="text-small text-text-muted">{t('learned.none')}</p>
						)
					)}
					{recallProgress.leftOut > 0 && (
						<p className="text-small text-text-muted">
							{t('learned.leftOut', { count: recallProgress.leftOut })}
						</p>
					)}
				</StepCard>

				<Button asChild variant="secondary" className="self-start">
					<Link href="/today">{t('backToToday')}</Link>
				</Button>
			</main>
		</div>
	)
}
