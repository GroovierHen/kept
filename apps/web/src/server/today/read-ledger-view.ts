import 'server-only'
import type { LedgerResponse } from '@kept/contract'
import { dayNumber, type KeptDay } from '@/lib/kept-day'
import { dayOutcomes } from '@/lib/ledger'
import { readLedger } from './read-ledger'

/**
 * The app's Ledger, from the same read as the web's Ledger page
 * (src/app/[locale]/ledger), with Kept days turned into day numbers.
 */
export async function readLedgerView(userId: string): Promise<LedgerResponse> {
	const {
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
	} = await readLedger(userId)
	const dayOf = (day: KeptDay) => dayNumber({ signUpDay, today: day })
	const promiseOn = new Map(promises.map((promise) => [promise.promiseDay, promise]))

	return {
		day: dayOf(today),
		goal,
		promises: {
			kept: ledger.kept.map(dayOf),
			partly: ledger.partly.map(dayOf),
			slipped: ledger.slipped.map(dayOf)
		},
		days: dayOutcomes({
			ledger,
			promiseDays: promises.map(({ promiseDay }) => promiseDay),
			from: signUpDay,
			today
		}).map(({ day, outcome }) => {
			const promise = promiseOn.get(day)
			return {
				day: dayOf(day),
				outcome,
				promise: promise == null ? null : { wording: promise.wording, moment: promise.moment }
			}
		}),
		sizeChanges: ledger.sizeChanges.flatMap((change) => {
			const action = actions.find(({ id }) => id === change.actionId)
			return action == null
				? []
				: [
						{
							direction: change.direction,
							wording: action.sizes[change.to],
							from: change.from,
							to: change.to,
							day: dayOf(change.promiseDay)
						}
					]
		}),
		learned: {
			ideas: recallProgress.ideas.map(({ keyIdeaId, title, first, last }) => ({
				keyIdeaId,
				title,
				first: { score: first.score, day: dayOf(first.keptDay) },
				last: { score: last.score, day: dayOf(last.keptDay) }
			})),
			leftOut: recallProgress.leftOut
		},
		week: { kept: ledger.week.kept, total: ledger.week.total },
		streak,
		milestone:
			milestone == null
				? null
				: { week: milestone.week, text: milestone.text, daysLeft: milestone.daysLeft },
		milestones: milestones.map(({ id, week, text }) => ({ id, week, text }))
	}
}
