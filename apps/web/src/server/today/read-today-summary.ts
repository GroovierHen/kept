import 'server-only'
import type { CheckInView, TodayResponse } from '@kept/contract'
import { canChangePromise, closedAsUnreported } from '@/lib/check-in'
import { promiseStatus, type KeptDay } from '@/lib/kept-day'
import {
	changeChoices,
	commitSelection,
	planChoices,
	preSelected,
	type PromiseSelection
} from './plan-choices'
import { readCheckInState, recentDays, type CheckInState } from './read-check-in-state'

/**
 * The app's Today screen: the step the Act loop picks, what that step shows,
 * the Promise it is about, the last seven days and the next milestone. Read
 * from the same state the web Today page renders (src/app/[locale]/today).
 */
export async function readTodaySummary(userId: string): Promise<TodayResponse> {
	const state = await readCheckInState(userId)
	const { today, day, step, latestPromise, changeableReport, ledger } = state

	return {
		today,
		day,
		step,
		promise:
			latestPromise == null
				? null
				: {
						wording: latestPromise.wording,
						moment: latestPromise.moment,
						promiseDay: latestPromise.promiseDay,
						status: promiseStatus({ promiseDay: latestPromise.promiseDay, today })
					},
		strip: recentDays(state),
		week: { kept: ledger.ledger.week.kept, total: ledger.ledger.week.total },
		milestone:
			ledger.milestone == null
				? null
				: { text: ledger.milestone.text, daysLeft: ledger.milestone.daysLeft },
		checkIn: await checkInView(userId, state),
		changeableReport:
			changeableReport?.latestAnswer == null
				? null
				: {
						promiseId: changeableReport.id,
						promiseDay: changeableReport.promiseDay,
						wording: changeableReport.wording,
						answer: changeableReport.latestAnswer,
						when: whenOf({ promiseDay: changeableReport.promiseDay, today })
					},
		unreported: closedAsUnreported({ today, latestPromise })
	}
}

const whenOf = ({ promiseDay, today }: { promiseDay: KeptDay; today: KeptDay }) =>
	promiseDay === today ? ('today' as const) : ('yesterday' as const)

const selection = (picked: PromiseSelection | undefined) =>
	picked == null
		? null
		: { moment: picked.moment, actionId: picked.actionId ?? null, typed: picked.typed ?? null }

// What the current step needs, worked out the way the web's step components
// work it out (src/components/today/commit-step.tsx).
async function checkInView(userId: string, state: CheckInState): Promise<CheckInView> {
	const { step, today, latestPromise, dueReviews, lesson, hasLearnedToday } = state

	if (step === 'report' && latestPromise != null) {
		return {
			step,
			promiseId: latestPromise.id,
			when: whenOf({ promiseDay: latestPromise.promiseDay, today })
		}
	}
	if (step === 'learn') {
		const [recall] = dueReviews
		return {
			step,
			recall: recall == null ? null : { ...recall, choices: [...recall.choices] },
			lesson: recall == null ? lesson : null
		}
	}
	if (step === 'done') {
		const canChange = latestPromise != null && canChangePromise({ ...latestPromise, today })
		const change = canChange ? await planChoices(userId) : null
		return {
			step,
			change:
				change == null || latestPromise == null
					? null
					: {
							promiseId: latestPromise.id,
							actions: changeChoices({ actions: change.actions, promise: latestPromise }),
							initial: selection(preSelected(latestPromise))
						},
			learned: hasLearnedToday ? lesson : null
		}
	}

	// Commit, and a report step with no Promise to report (setup always makes one).
	const { actions, nudge } = await planChoices(userId)
	return {
		step: 'commit',
		picker: { actions, initial: selection(commitSelection({ current: latestPromise, nudge })) },
		nudge: nudge?.kind ?? null,
		hasCurrent: latestPromise != null
	}
}
