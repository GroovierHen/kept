import { randomUUID } from 'node:crypto'
import { getTranslations } from 'next-intl/server'
import { PromiseForm } from '@/components/setup/promise-form'
import { CalendarIcon } from '@/components/ui/icons'
import { promiseNudge, workedOutSize } from '@/lib/adaptive'
import type { PromiseMoment } from '@/lib/promise'
import { submitNextPromise, submitPromiseChange } from '@/server/actions/today'
import { db } from '@/server/db/client'
import { getPlan } from '@/server/learn/learn'
import { readPromiseHistory } from '@/server/promises/read-promise-history'
import { ChangePanel } from './change-panel'

interface CurrentPromise {
	readonly planActionId: string | null
	readonly wording: string
	readonly moment: PromiseMoment
}

const preSelected = (current: CurrentPromise) => ({
	moment: current.moment,
	...(current.planActionId == null
		? { typed: current.wording }
		: { actionId: current.planActionId })
})

// Each Action at the Size its next Promise would be made at.
async function planChoices(userId: string) {
	const [plan, history] = await Promise.all([
		getPlan(userId),
		readPromiseHistory({ client: db, userId })
	])
	return {
		actions: plan.actions.map(({ id, sizes }) => ({
			id,
			wording: sizes[workedOutSize({ history, actionId: id })]
		})),
		nudge: promiseNudge({ history, planActionIds: plan.actions.map(({ id }) => id) })
	}
}

// The current Promise comes pre-selected, moment and all, so keeping it is one tap.
// An offered Action takes its place, and the user can still pick the old one.
// Laid out as the whole step: `heading` over it, `footer` under it and `aside`
// on the green panel under the new promise.
export async function CommitStep({
	userId,
	current,
	heading,
	footer,
	aside
}: {
	userId: string
	current: CurrentPromise | null
	heading: React.ReactNode
	footer?: React.ReactNode
	aside?: React.ReactNode
}) {
	const [{ actions, nudge }, t] = await Promise.all([
		planChoices(userId),
		getTranslations('TodayPage.commit')
	])
	const initial =
		current == null
			? undefined
			: {
					...preSelected(current),
					...(nudge?.kind === 'differentAction' && { actionId: nudge.actionId })
				}

	return (
		// Keyed so a changed Report that adds or withdraws an offer also moves the selection.
		<PromiseForm
			key={initial?.actionId ?? 'typed'}
			submit={submitNextPromise}
			initial={initial}
			actions={actions}
			screen={{
				heading,
				lead: nudge != null ? t(`nudge.${nudge.kind}`) : current != null ? t('lead') : undefined,
				footer: (
					<>
						<p className="text-text-muted mt-3.5 flex items-center justify-center gap-2 text-[14px]">
							<CalendarIcon size={16} className="text-accent" />
							{t('reminder')}
						</p>
						{footer}
					</>
				),
				aside
			}}
		/>
	)
}

export async function ChangePromise({
	userId,
	promise
}: {
	userId: string
	promise: CurrentPromise & { readonly id: string }
}) {
	const [{ actions }, t] = await Promise.all([
		planChoices(userId),
		getTranslations('TodayPage.changePromise')
	])
	const changeId = randomUUID()
	// Its own Action stays as committed, whatever a Report changed since then says.
	const choices = actions.map((action) =>
		action.id === promise.planActionId ? { ...action, wording: promise.wording } : action
	)

	// Keyed so a saved change closes the panel and clears the form.
	return (
		<ChangePanel key={changeId} summary={t('summary')} hint={t('hint')}>
			<PromiseForm
				submit={submitPromiseChange.bind(null, { promiseId: promise.id, changeId })}
				initial={preSelected(promise)}
				actions={choices}
				submitLabel={t('submit')}
			/>
		</ChangePanel>
	)
}
