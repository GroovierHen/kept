import { getTranslations } from 'next-intl/server'
import { SETUP_STEPS } from '@/lib/setup-step'
import { commitPromise } from '@/server/actions/setup'
import { getPlan } from '@/server/learn/learn'
import { PromiseForm } from './promise-form'
import { StepIntro } from './setup-layout'

// Setup's promise step (#13): the plan's actions in the AI's order, each at
// small, the first one selected.
export async function PromiseStep({ userId }: { userId: string }) {
	const [plan, t] = await Promise.all([getPlan(userId), getTranslations('SetupPage')])

	return (
		<PromiseForm
			submit={commitPromise}
			actions={plan.actions.map(({ id, sizes }) => ({ id, wording: sizes.small }))}
			setup={{
				heading: (
					<StepIntro
						progress={{ current: SETUP_STEPS.indexOf('promise'), total: SETUP_STEPS.length }}
						eyebrow={t('progress', {
							current: SETUP_STEPS.indexOf('promise') + 1,
							total: SETUP_STEPS.length
						})}
						title={t('steps.promise')}
					/>
				)
			}}
		/>
	)
}
