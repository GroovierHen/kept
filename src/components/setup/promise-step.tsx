import { getTranslations } from 'next-intl/server'
import { StepCard } from '@/components/ui/step-card'
import { SETUP_STEPS } from '@/lib/setup-step'
import { getPlan } from '@/server/learn/learn'
import { PromiseForm } from './promise-form'

// Setup's promise step (#13): the plan's actions in Gemini's order, each at
// small, the first one selected.
export async function PromiseStep({ userId }: { userId: string }) {
	const [plan, t] = await Promise.all([getPlan(userId), getTranslations('SetupPage')])

	return (
		<StepCard
			eyebrow={t('progress', {
				current: SETUP_STEPS.indexOf('promise') + 1,
				total: SETUP_STEPS.length
			})}
			title={t('steps.promise')}
		>
			<PromiseForm actions={plan.actions.map(({ id, sizes }) => ({ id, wording: sizes.small }))} />
		</StepCard>
	)
}
