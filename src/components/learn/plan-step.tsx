import { getTranslations } from 'next-intl/server'
import { StepCard } from '@/components/ui/step-card'
import { isBuildRunning, secondsSince } from '@/lib/learn/plan-build'
import { confirmPlan } from '@/server/actions/plan'
import { getBuildState } from '@/server/learn/claim-build'
import { getPlanDraft, getPlanStatus } from '@/server/learn/learn'
import { ActionEditor } from './action-editor'
import { BuildPlanForm } from './build-plan-form'
import { ConfirmPlanButton } from './confirm-plan-button'
import { PlanWaiting } from './plan-waiting'
import { RebuildPlanArea } from './rebuild-plan-area'

// Setup's plan step (#30). With a complete goal and no plan: say where the
// goal goes, then one button builds it, or the wait if a build is already
// running (a refresh, a second tab). With a plan: show it, let the person
// reword or remove actions and Try again once, then Confirm, which locks it.
export async function PlanStep({
	userId,
	hasSaveFailed
}: {
	userId: string
	hasSaveFailed: boolean
}) {
	const [status, build, t] = await Promise.all([
		getPlanStatus(userId),
		getBuildState(userId),
		getTranslations('Learn.plan')
	])

	if (status === 'goal_saved') {
		const { goalText, startedAt } = build
		const now = new Date()
		return (
			<StepCard eyebrow={t('eyebrow')} title={t('build.title')}>
				<p className="text-body">{t('build.body')}</p>
				<p className="text-small text-text-muted">{t('build.privacy')}</p>
				{startedAt != null && isBuildRunning({ startedAt, now }) ? (
					<PlanWaiting
						title={t('build.pending')}
						goalText={goalText}
						secondsSoFar={secondsSince({ startedAt, now })}
						shouldRefresh
					/>
				) : (
					<BuildPlanForm goalText={goalText} />
				)}
			</StepCard>
		)
	}
	if (status !== 'plan_made') return null

	const plan = await getPlanDraft(userId)
	if (plan == null || plan.goal.text == null) return null

	return (
		<StepCard eyebrow={t('eyebrow')} title={plan.goal.text}>
			<RebuildPlanArea canRebuild={plan.canRebuild}>
				<p className="text-small text-text-faint">
					{t('weeks', { weeks: plan.goal.weeks ?? 0 })} ·{' '}
					{t('keyIdeas', { count: plan.keyIdeaCount })}
				</p>

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
								<span className="text-body">{action.small}</span>
								<span className="text-small text-text-muted">
									{t('bigger', { medium: action.medium, large: action.large })}
								</span>
								<ActionEditor action={action} canRemove={plan.actions.length > 1} />
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
			</RebuildPlanArea>
		</StepCard>
	)
}
