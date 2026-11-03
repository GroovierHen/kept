import { getTranslations } from 'next-intl/server'
import { LockIcon } from '@/components/ui/icons'
import { AsideCard, SetupAside, SetupMain, StepIntro } from '@/components/setup/setup-layout'
import { cn } from '@/lib/cn'
import { isBuildRunning, secondsSince } from '@/lib/learn/plan-build'
import { SETUP_STEPS } from '@/lib/setup-step'
import { confirmPlan } from '@/server/actions/plan'
import { getBuildState } from '@/server/learn/claim-build'
import { getGoal, getPlanDraft, getPlanStatus } from '@/server/learn/learn'
import { ActionEditor } from './action-editor'
import { BuildPlanForm } from './build-plan-form'
import { ConfirmPlanButton } from './confirm-plan-button'
import { GoalDraftAside } from './goal-steps'
import { PlanChecks } from './plan-checks'
import { PlanWaiting } from './plan-waiting'
import { RebuildPlanArea } from './rebuild-plan-area'

const SIZES = ['small', 'medium', 'large'] as const

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
	const [status, build, t, tSetup] = await Promise.all([
		getPlanStatus(userId),
		getBuildState(userId),
		getTranslations('Learn.plan'),
		getTranslations('SetupPage')
	])
	const eyebrow = `${tSetup('progress', {
		current: SETUP_STEPS.indexOf('plan') + 1,
		total: SETUP_STEPS.length
	})} · ${tSetup('steps.plan')}`
	const progress = { current: SETUP_STEPS.indexOf('plan'), total: SETUP_STEPS.length }

	if (status === 'goal_saved') {
		const { goalText, startedAt } = build
		const now = new Date()
		const goal = await getGoal(userId)
		return (
			<>
				<SetupMain>
					<StepIntro progress={progress} eyebrow={eyebrow} title={t('build.title')} />
					<p className="text-text-muted max-w-[52ch] text-[17px] leading-[1.55]">
						{t('build.body')}
					</p>
					<ul className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
						{(['milestones', 'actions', 'keyIdeas'] as const).map((feature) => (
							<li
								key={feature}
								className="border-border bg-surface rounded-[18px] border p-4 text-[14px] font-semibold"
							>
								{t(`build.features.${feature}`)}
							</li>
						))}
					</ul>
					<p className="border-border bg-surface text-text-muted mt-5 flex items-start gap-3 rounded-[14px] border px-4 py-3.5 text-[14px] leading-normal">
						<LockIcon size={20} className="text-accent mt-px flex-none" />
						{t('build.privacy')}
					</p>
					<div className="mt-7">
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
					</div>
				</SetupMain>
				<GoalDraftAside goal={goal} current={null} />
			</>
		)
	}
	if (status !== 'plan_made') return null

	const plan = await getPlanDraft(userId)
	if (plan == null || plan.goal.text == null) return null
	const weeks = plan.goal.weeks ?? 0

	return (
		<>
			<SetupMain className="max-w-[720px]">
				<StepIntro progress={progress} eyebrow={eyebrow} title={plan.goal.text} />
				<RebuildPlanArea canRebuild={plan.canRebuild}>
					<ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
						<Stat value={weeks} label={t('review.stats.weeks')} />
						<Stat
							value={plan.actions.length}
							label={t('review.stats.actions', { count: plan.actions.length })}
						/>
						<Stat
							value={plan.keyIdeaCount}
							label={t('review.stats.keyIdeas', { count: plan.keyIdeaCount })}
						/>
					</ul>

					<section aria-labelledby="plan-milestones" className="mt-11">
						<h2 id="plan-milestones" className="face-display text-[26px] font-bold">
							{t('milestones')}
						</h2>
						<p className="text-text-muted mt-1.5 mb-5 text-[15px]">{t('review.milestonesHint')}</p>
						<ol className="relative grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
							<li
								aria-hidden
								className="bg-border-strong absolute top-[11px] right-3 left-3 hidden h-0.5 sm:block"
							/>
							{plan.milestones.map((milestone, index) => {
								const isLast = index === plan.milestones.length - 1
								return (
									<li key={milestone.id} className="relative flex flex-col gap-3">
										<span
											aria-hidden
											className={cn(
												'border-accent hidden size-6 rounded-full border-2 sm:block',
												isLast ? 'bg-coral' : 'bg-surface'
											)}
										/>
										<div
											className={cn(
												'flex flex-1 flex-col gap-1.5 rounded-2xl border p-3.5',
												isLast ? 'border-coral bg-coral-soft' : 'border-border bg-surface'
											)}
										>
											<span className="text-coral-deep text-[12px] font-semibold tracking-[0.06em] uppercase">
												{t('review.week', { week: milestone.week })}
											</span>
											<span className="text-[15px] leading-[1.35] font-semibold">
												{milestone.text}
											</span>
										</div>
									</li>
								)
							})}
						</ol>
					</section>

					<section aria-labelledby="plan-actions" className="mt-11">
						<h2 id="plan-actions" className="face-display text-[26px] font-bold">
							{t('actions')}
						</h2>
						<p className="text-text-muted mt-1.5 mb-5 text-[15px] leading-normal">
							{t('review.actionsHint')}
						</p>
						<ul className="flex flex-col gap-3">
							{plan.actions.map((action) => (
								<li
									key={action.id}
									className="border-border bg-surface flex flex-col gap-4 rounded-[22px] border p-5"
								>
									<ol className="flex flex-col gap-2">
										{SIZES.map((size, rung) => (
											<li
												key={size}
												className={cn(
													'grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3.5 rounded-[14px] px-3.5 py-3',
													rung === 0 && 'bg-coral-soft'
												)}
											>
												<span className="flex flex-col gap-1.5">
													<span
														className={cn(
															'text-[12px] font-semibold',
															rung === 0 ? 'text-coral-deep' : 'text-text-faint'
														)}
													>
														{t(`edit.sizes.${size}`)}
													</span>
													<span aria-hidden className="flex h-4 items-end gap-[3px]">
														{SIZES.map((bar, height) => (
															<span
																key={bar}
																className={cn(
																	'w-2 rounded-[2px]',
																	height === 0 && 'h-1.5',
																	height === 1 && 'h-[11px]',
																	height === 2 && 'h-4',
																	height <= rung ? 'bg-accent' : 'bg-border-strong'
																)}
															/>
														))}
													</span>
												</span>
												<span
													className={cn(
														'leading-[1.4] first-letter:uppercase',
														rung === 0 ? 'text-[17px] font-semibold' : 'text-text-muted text-[15px]'
													)}
												>
													{action[size]}
												</span>
											</li>
										))}
									</ol>
									<ActionEditor action={action} canRemove={plan.actions.length > 1} />
								</li>
							))}
						</ul>
					</section>

					<form
						action={confirmPlan}
						className="border-border bg-surface mt-11 flex flex-col gap-[18px] rounded-3xl border p-[clamp(20px,2.4vw,28px)]"
					>
						<div className="flex items-start gap-3.5">
							<LockIcon size={22} className="text-accent mt-1 flex-none" />
							<div>
								<h2 className="text-[18px] font-bold">{t('review.confirmTitle')}</h2>
								<p className="text-text-muted mt-1 text-[15px] leading-normal">
									{t('confirmHint')}
								</p>
							</div>
						</div>
						{hasSaveFailed && (
							<p role="alert" className="text-danger text-[15px]">
								{t('confirmFailed')}
							</p>
						)}
						<ConfirmPlanButton />
					</form>
				</RebuildPlanArea>
			</SetupMain>

			<SetupAside label={t('review.checkLabel')} lead={t('review.checkLead')}>
				<PlanChecks
					items={[t('review.checks.badDay'), t('review.checks.reach'), t('review.checks.obstacle')]}
					hint={t('review.checkHint')}
				/>
				<AsideCard className="mt-auto">
					<p className="text-text-faint text-[13px] font-medium">{t('review.tomorrow')}</p>
					<p className="text-text-muted mt-3 text-[14px]">{t('review.tomorrowLead')}</p>
					<ul className="mt-3 flex flex-col gap-1.5">
						{plan.actions.map((action) => (
							<li
								key={action.id}
								className="bg-bg rounded-xl px-3 py-2.5 text-[15px] leading-[1.35] font-semibold first-letter:uppercase"
							>
								{action.small}
							</li>
						))}
					</ul>
				</AsideCard>
			</SetupAside>
		</>
	)
}

function Stat({ value, label }: { value: number; label: string }) {
	return (
		<li className="border-border bg-surface rounded-[20px] border p-[18px]">
			<p className="face-display text-[40px] leading-none font-extrabold tabular-nums">{value}</p>
			<p className="text-text-muted mt-2 text-[14px]">{label}</p>
		</li>
	)
}
