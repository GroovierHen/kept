import { randomUUID } from 'node:crypto'
import type { Metadata } from 'next'
import { getLocale, getTranslations } from 'next-intl/server'
import { Link, redirect } from '@/i18n/routing'
import { LearnCard } from '@/components/learn/learn-card'
import { LearnedButton } from '@/components/learn/learned-button'
import { RecallCard } from '@/components/learn/recall-card'
import { SetupAside, SetupMain } from '@/components/setup/setup-layout'
import { SETUP_BUTTON } from '@/components/setup/setup-styles'
import { AppShell } from '@/components/today/app-shell'
import { ChangeReport } from '@/components/today/change-report'
import { ChangePromise, CommitStep } from '@/components/today/commit-step'
import { ReportForm } from '@/components/today/report-form'
import { StepTitle } from '@/components/today/step-title'
import {
	CheckInIntro,
	CheckInRail,
	MilestoneNote,
	PromiseTicket,
	WeekStrip
} from '@/components/today/today-layout'
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, CheckIcon, InfoIcon } from '@/components/ui/icons'
import { canChangePromise, checkInStep, closedAsUnreported } from '@/lib/check-in'
import { cn } from '@/lib/cn'
import { addDays, dayNumber, type KeptDay } from '@/lib/kept-day'
import { dayOutcomes } from '@/lib/ledger'
import type { PromiseMoment } from '@/lib/promise'
import { reportQuestionWording } from '@/lib/report'
import { finishLearning } from '@/server/actions/today'
import { getSignedInUser } from '@/server/auth/session'
import { db } from '@/server/db/client'
import { getDueReviews, getTodaysLesson } from '@/server/learn/learn'
import { hasLearnedOn } from '@/server/learn/teach-lesson'
import { readSetupStep } from '@/server/setup/progress'
import { readCheckIn } from '@/server/today/read-check-in'
import { readLedger } from '@/server/today/read-ledger'

// Marking a recall answer is an AI call with up to 2 tries of 45s; the usual
// case is a few seconds. Server actions on this page share it.
export const maxDuration = 100

const STRIP_DAYS = 7
const WEEK_DAYS = 7

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
	const [dueReviews, lesson, hasLearnedToday, ledger, t, tLedger, tPromise] = await Promise.all([
		getDueReviews(user.id, today),
		getTodaysLesson(user.id, today),
		hasLearnedOn({ userId: user.id, today }),
		readLedger(user.id),
		getTranslations('TodayPage'),
		getTranslations('LedgerPage'),
		getTranslations('SetupPage.promise')
	])
	const step = checkInStep({
		today,
		latestPromise,
		// Learning is today's recalls first, then the new idea if there is one.
		hasLearned: dueReviews.length === 0 && (hasLearnedToday || lesson == null)
	})
	const [recall] = dueReviews
	const dayOf = (keptDay: KeptDay) => dayNumber({ signUpDay: ledger.signUpDay, today: keptDay })

	const stripStart = addDays({ day: today, days: 1 - STRIP_DAYS })
	const strip = dayOutcomes({
		ledger: ledger.ledger,
		promiseDays: ledger.promises.map(({ promiseDay }) => promiseDay),
		from: stripStart > ledger.signUpDay ? stripStart : ledger.signUpDay,
		today
	}).map(({ day: keptDay, outcome }) => ({ day: dayOf(keptDay), outcome }))
	const { week } = ledger.ledger
	const asideExtras = (
		<>
			<WeekStrip
				days={strip}
				summary={
					week.total === 0 ? null : tLedger('week.kept', { kept: week.kept, total: week.total })
				}
			/>
			{ledger.milestone != null && (
				<MilestoneNote
					heading={t('aside.milestone')}
					text={ledger.milestone.text}
					due={tLedger('milestone.due', { days: ledger.milestone.daysLeft })}
				/>
			)}
		</>
	)
	const unreportedNote = closedAsUnreported({ today, latestPromise }) && (
		<p className="text-text-muted mt-4 text-[15px]">{t('unreportedNote')}</p>
	)
	const changeReport = changeableReport?.latestAnswer != null && (
		<div className="mt-8">
			<ChangeReport
				report={{ ...changeableReport, latestAnswer: changeableReport.latestAnswer }}
				today={today}
			/>
		</div>
	)
	const promiseMoment = (moment: PromiseMoment) => tPromise(`moments.${moment}`)

	return (
		<AppShell current="today">
			<CheckInRail
				step={step}
				day={day}
				goal={ledger.goal}
				week={Math.min(Math.ceil(day / WEEK_DAYS), ledger.goal.weeks)}
			/>

			{step === 'commit' ? (
				<CommitStep
					userId={user.id}
					current={latestPromise}
					heading={
						<>
							<CheckInIntro step={step} day={day} />
							{unreportedNote}
							<StepTitle>{t('commit.title')}</StepTitle>
						</>
					}
					footer={changeReport}
					aside={asideExtras}
				/>
			) : (
				<>
					<SetupMain>
						<CheckInIntro step={step} day={day} />
						{unreportedNote}

						{step === 'report' && latestPromise != null && (
							<>
								<StepTitle
									eyebrow={t(
										`report.when.${latestPromise.promiseDay === today ? 'today' : 'yesterday'}`,
										{ moment: promiseMoment(latestPromise.moment) }
									)}
								>
									{t(
										`report.question.${latestPromise.promiseDay === today ? 'today' : 'yesterday'}`,
										{ wording: reportQuestionWording(latestPromise.wording) }
									)}
								</StepTitle>
								<p className="text-text-muted max-w-[52ch] text-[17px] leading-[1.55]">
									{t('report.lead')}
								</p>
								<div className="mt-8">
									<ReportForm promiseId={latestPromise.id} reportId={randomUUID()} />
								</div>
								<p className="text-text-muted mt-2 flex items-start gap-2.5 text-[14px] leading-normal">
									<InfoIcon size={18} className="text-accent mt-0.5 flex-none" />
									{t('report.note')}
								</p>
							</>
						)}

						{step === 'learn' && recall != null && (
							<RecallCard key={recall.keyIdeaId} review={recall} />
						)}

						{step === 'learn' && recall == null && lesson != null && (
							<LearnCard
								lesson={lesson}
								mode="step"
								footer={
									<form action={finishLearning} className="mt-9">
										<input type="hidden" name="keyIdeaId" value={lesson.keyIdeaId} />
										<LearnedButton />
									</form>
								}
							/>
						)}

						{step === 'done' && (
							<>
								<span className="bg-coral text-accent mt-7 grid size-[72px] place-items-center rounded-full shadow-[0_0_0_8px_var(--accent-soft)]">
									<CheckIcon size={34} />
								</span>
								<StepTitle>{t('done.title')}</StepTitle>
								<p className="text-text-muted max-w-[52ch] text-[17px] leading-[1.55]">
									{t('done.nextCheckIn')}
								</p>
								<Button asChild className={cn(SETUP_BUTTON, 'mt-7')}>
									<Link href="/ledger">
										{t('ledgerLink')}
										<ArrowRightIcon size={18} />
									</Link>
								</Button>
								{latestPromise != null && canChangePromise({ ...latestPromise, today }) && (
									<div className="mt-8">
										<ChangePromise userId={user.id} promise={latestPromise} />
									</div>
								)}
							</>
						)}

						{changeReport}

						{step === 'done' && hasLearnedToday && lesson != null && (
							<div className="mt-4">
								<LearnCard lesson={lesson} mode="summary" />
							</div>
						)}
					</SetupMain>

					{latestPromise != null && (
						<SetupAside
							label={
								step === 'done'
									? t('aside.label.next')
									: t(`aside.label.${latestPromise.promiseDay === today ? 'today' : 'yesterday'}`)
							}
							lead={
								step === 'done'
									? t('aside.next')
									: step === 'report'
										? t('aside.promised', { day: dayOf(latestPromise.committedOn) })
										: t('aside.answered')
							}
						>
							<PromiseTicket
								when={t('aside.when', {
									day: dayOf(latestPromise.promiseDay),
									moment: promiseMoment(latestPromise.moment)
								})}
								sentence={tPromise(`sentences.${latestPromise.moment}`, {
									wording: latestPromise.wording
								})}
								foot={step === 'done' ? t('aside.foot.made') : t('aside.foot.answer')}
								stamp={
									step === 'done'
										? t('aside.stamp.made')
										: latestPromise.latestAnswer == null
											? t('aside.stamp.waiting')
											: t(`report.answers.${latestPromise.latestAnswer}`)
								}
								isStamped={step === 'done' || latestPromise.latestAnswer != null}
							/>
							{asideExtras}
						</SetupAside>
					)}
				</>
			)}
		</AppShell>
	)
}
