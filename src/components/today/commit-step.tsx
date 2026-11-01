import { randomUUID } from 'node:crypto'
import { getTranslations } from 'next-intl/server'
import { PromiseForm } from '@/components/setup/promise-form'
import { StepCard } from '@/components/ui/step-card'
import type { PromiseMoment } from '@/lib/promise'
import { submitNextPromise, submitPromiseChange } from '@/server/actions/today'
import { getPlan } from '@/server/learn/learn'
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

async function planChoices(userId: string) {
	const plan = await getPlan(userId)
	return plan.actions.map(({ id, sizes }) => ({ id, wording: sizes.small }))
}

// The current Promise comes pre-selected, moment and all, so keeping it is one tap.
export async function CommitStep({
	userId,
	current
}: {
	userId: string
	current: CurrentPromise | null
}) {
	const [actions, t] = await Promise.all([planChoices(userId), getTranslations('TodayPage.commit')])

	return (
		<StepCard title={t('title')}>
			<PromiseForm
				submit={submitNextPromise}
				initial={current == null ? undefined : preSelected(current)}
				actions={actions}
			/>
			<p className="text-small text-text-muted">{t('reminder')}</p>
		</StepCard>
	)
}

export async function ChangePromise({
	userId,
	promise
}: {
	userId: string
	promise: CurrentPromise & { readonly id: string }
}) {
	const [actions, t] = await Promise.all([
		planChoices(userId),
		getTranslations('TodayPage.changePromise')
	])
	const changeId = randomUUID()

	// Keyed so a saved change closes the panel and clears the form.
	return (
		<ChangePanel key={changeId} summary={t('summary')} hint={t('hint')}>
			<PromiseForm
				submit={submitPromiseChange.bind(null, { promiseId: promise.id, changeId })}
				initial={preSelected(promise)}
				actions={actions}
				submitLabel={t('submit')}
			/>
		</ChangePanel>
	)
}
