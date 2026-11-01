import { randomUUID } from 'node:crypto'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link, redirect } from '@/i18n/routing'
import { LearnCard } from '@/components/learn/learn-card'
import { SiteNav } from '@/components/landing/site-nav'
import { ChangeReport } from '@/components/today/change-report'
import { ChangePromise, CommitStep } from '@/components/today/commit-step'
import { ReportForm } from '@/components/today/report-form'
import { Button } from '@/components/ui/button'
import { StepCard } from '@/components/ui/step-card'
import { canChangePromise, checkInStep, closedAsUnreported } from '@/lib/check-in'
import { reportQuestionWording } from '@/lib/report'
import { signOut } from '@/server/actions/auth'
import { finishLearning } from '@/server/actions/today'
import { getSignedInUser } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { getTodaysLesson } from '@/server/learn/learn'
import { hasLearnedOn } from '@/server/learn/teach-lesson'
import { readSetupStep } from '@/server/setup/progress'
import { readCheckIn } from '@/server/today/read-check-in'

export async function generateMetadata(): Promise<Metadata> {
	const t = await getTranslations('TodayPage.meta')
	return { title: t('title'), robots: { index: false, follow: false } }
}

// The check-in, one step at a time. The Act loop (src/lib/check-in.ts) picks the
// step. The daily reminder lands here, and sign-in once setup is finished.
export default async function TodayPage() {
	const locale = await getLocale()
	const user = await getSignedInUser()
	if (user == null) return redirect({ href: '/sign-in', locale })
	if ((await readSetupStep(user.id)) != null) {
		return redirect({ href: '/setup', locale })
	}

	const { today, day, latestPromise, changeableReport } = await readCheckIn({
		client: db,
		userId: user.id
	})
	const [lesson, hasLearnedToday, t, tPromise] = await Promise.all([
		getTodaysLesson(user.id, today),
		hasLearnedOn({ userId: user.id, today }),
		getTranslations('TodayPage'),
		getTranslations('SetupPage.promise')
	])
	const step = checkInStep({
		today,
		latestPromise,
		// TEMPORARY: a day with no new idea can still have recalls, so this changes with #32.
		hasLearned: hasLearnedToday || lesson == null
	})

	return (
		<div className="flex min-h-svh flex-col">
			<SiteNav />
			<main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-(--page-margin) pb-24">
				<h1 className="text-lead font-medium">{t('day', { day })}</h1>

				{closedAsUnreported({ today, latestPromise }) && (
					<p className="text-body text-text-muted">{t('unreportedNote')}</p>
				)}

				{step === 'report' && latestPromise != null && (
					<StepCard
						title={t(
							`report.question.${latestPromise.promiseDay === today ? 'today' : 'yesterday'}`,
							{
								wording: reportQuestionWording(latestPromise.wording)
							}
						)}
					>
						<ReportForm promiseId={latestPromise.id} reportId={randomUUID()} />
					</StepCard>
				)}

				{step === 'learn' && lesson != null && (
					<LearnCard
						lesson={lesson}
						mode="step"
						footer={
							<form action={finishLearning}>
								<input type="hidden" name="keyIdeaId" value={lesson.keyIdeaId} />
								<Button type="submit" size="lg" className="text-body h-12 w-full">
									{t('learn.continue')}
								</Button>
							</form>
						}
					/>
				)}

				{step === 'commit' && <CommitStep userId={user.id} current={latestPromise} />}

				{step === 'done' && (
					<>
						<StepCard title={t('done.title')}>
							{latestPromise != null && (
								<div className="flex flex-col gap-1">
									<h3 className="text-small font-semibold">{t('done.nextPromise')}</h3>
									<p className="text-body">
										{tPromise(`sentences.${latestPromise.moment}`, {
											wording: latestPromise.wording
										})}
									</p>
								</div>
							)}
							<p className="text-small text-text-muted">{t('done.nextCheckIn')}</p>
							{latestPromise != null && canChangePromise({ ...latestPromise, today }) && (
								<ChangePromise userId={user.id} promise={latestPromise} />
							)}
						</StepCard>
						{hasLearnedToday && lesson != null && <LearnCard lesson={lesson} mode="summary" />}
					</>
				)}

				{changeableReport?.latestAnswer != null && (
					<ChangeReport
						report={{ ...changeableReport, latestAnswer: changeableReport.latestAnswer }}
						today={today}
					/>
				)}

				<Button asChild variant="secondary" className="self-start">
					<Link href="/ledger">{t('ledgerLink')}</Link>
				</Button>

				<form action={signOut}>
					<Button type="submit" variant="ghost">
						{t('signOut')}
					</Button>
				</form>
			</main>
		</div>
	)
}
