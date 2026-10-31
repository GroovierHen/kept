import { getTranslations } from 'next-intl/server'
import { StepCard } from '@/components/ui/step-card'
import { confirmPlan } from '@/server/actions/plan'
import { getPlan, getPlanStatus } from '@/server/learn/learn'
import { BuildPlanForm } from './build-plan-form'
import { ConfirmPlanButton } from './confirm-plan-button'

// Setup's plan step (#30). With a complete goal and no plan: say the goal goes
// to Gemini, then one button builds it. With a plan: show it and Confirm,
// which locks it. Editing and the one Try again come next.
export async function PlanStep({
	userId,
	hasSaveFailed
}: {
	userId: string
	hasSaveFailed: boolean
}) {
	const [status, t] = await Promise.all([getPlanStatus(userId), getTranslations('Learn.plan')])

	if (status === 'goal_saved') {
		return (
			<StepCard eyebrow={t('eyebrow')} title={t('build.title')}>
				<p className="text-body">{t('build.body')}</p>
				<p className="text-small text-text-muted">{t('build.privacy')}</p>
				<BuildPlanForm />
			</StepCard>
		)
	}
	if (status !== 'plan_made') return null

	const plan = await getPlan(userId)

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

			<form action={confirmPlan} className="flex flex-col gap-3">
				{hasSaveFailed && (
					<p role="alert" className="text-body text-danger">
						{t('confirmFailed')}
					</p>
				)}
				<p className="text-small text-text-muted">{t('confirmHint')}</p>
				<ConfirmPlanButton />
			</form>
		</StepCard>
	)
}
