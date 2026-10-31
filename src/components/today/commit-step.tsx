import { getTranslations } from 'next-intl/server'
import { PromiseForm } from '@/components/setup/promise-form'
import { StepCard } from '@/components/ui/step-card'
import type { PromiseMoment } from '@/lib/promise'
import { submitNextPromise } from '@/server/actions/today'
import { getPlan } from '@/server/learn/learn'

interface CurrentPromise {
	readonly planActionId: string | null
	readonly wording: string
	readonly moment: PromiseMoment
}

// The current Promise comes pre-selected, moment and all, so keeping it is one tap.
export async function CommitStep({
	userId,
	current
}: {
	userId: string
	current: CurrentPromise | null
}) {
	const [plan, t] = await Promise.all([getPlan(userId), getTranslations('TodayPage.commit')])
	const initial =
		current == null
			? undefined
			: {
					moment: current.moment,
					...(current.planActionId == null
						? { typed: current.wording }
						: { actionId: current.planActionId })
				}

	return (
		<StepCard title={t('title')}>
			<PromiseForm
				submit={submitNextPromise}
				initial={initial}
				actions={plan.actions.map(({ id, sizes }) => ({ id, wording: sizes.small }))}
			/>
			<p className="text-small text-text-muted">{t('reminder')}</p>
		</StepCard>
	)
}
