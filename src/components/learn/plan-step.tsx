import { getTranslations } from 'next-intl/server'
import { StepCard } from '@/components/ui/step-card'
import type { PlanForAct } from '@/lib/learn/plan'

// Shows a plan from getPlan: the goal, its milestones, and each action at all
// three sizes. Editing and Confirm come with the real plan step (#30); until
// then Act puts its own Continue in `footer`.
export async function PlanStep({ plan, footer }: { plan: PlanForAct; footer?: React.ReactNode }) {
	const t = await getTranslations('Learn.plan')

	return (
		<StepCard eyebrow={t('eyebrow')} title={plan.goal.text}>
			<p className="text-small text-text-muted">{t('weeks', { weeks: plan.goal.weeks })}</p>

			<section className="flex flex-col gap-2">
				<h3 className="text-small font-semibold">{t('milestones')}</h3>
				<ol className="flex flex-col gap-1">
					{plan.milestones.map((milestone) => (
						<li key={milestone.id} className="text-body">
							<span className="text-text-muted">{t('week', { week: milestone.week })}</span>{' '}
							{milestone.text}
						</li>
					))}
				</ol>
			</section>

			<section className="flex flex-col gap-2">
				<h3 className="text-small font-semibold">{t('actions')}</h3>
				<ul className="flex flex-col gap-3">
					{plan.actions.map((action) => (
						<li key={action.id} className="flex flex-col gap-0.5">
							<span className="text-body">{action.sizes.small}</span>
							<span className="text-small text-text-muted">
								{t('bigger', { medium: action.sizes.medium, large: action.sizes.large })}
							</span>
						</li>
					))}
				</ul>
			</section>
			{footer}
		</StepCard>
	)
}
