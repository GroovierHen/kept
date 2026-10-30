import { getTranslations } from 'next-intl/server'
import { StepCard } from '@/components/ui/step-card'
import { SARA_GOAL } from '@/lib/learn/sara-plan'

// TEMPORARY until the goal screens land (#29): shows Sara's answers read-only.
// Act places it in setup's goal step and puts its own Continue in `footer`.
export async function GoalSteps({ footer }: { footer?: React.ReactNode }) {
	const t = await getTranslations('Learn.goal')
	const answers = [
		{ label: t('goal'), value: SARA_GOAL.text },
		{ label: t('weeks'), value: t('weeksValue', { weeks: SARA_GOAL.weeks }) },
		{ label: t('startingPoint'), value: SARA_GOAL.startingPoint },
		{ label: t('obstacle'), value: SARA_GOAL.obstacle }
	]

	return (
		<StepCard eyebrow={t('eyebrow')} title={t('title')}>
			<dl className="flex flex-col gap-3">
				{answers.map(({ label, value }) => (
					<div key={label} className="flex flex-col gap-0.5">
						<dt className="text-small text-text-muted">{label}</dt>
						<dd className="text-body">{value}</dd>
					</div>
				))}
			</dl>
			{footer}
		</StepCard>
	)
}
