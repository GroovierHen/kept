'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { buildPlan } from '@/server/actions/plan'
import type { BuildPlanState } from '@/server/learn/plan-outcome'
import { GoalQuestionForm } from './goal-question-form'
import { PlanWaiting } from './plan-waiting'

const IDLE: BuildPlanState = { kind: 'idle' }

// The one button that sends the goal to the AI, then the wait while it
// writes. A goal the AI won't plan comes back with a safer version, ready to
// use or rewrite; a goal moderation stops comes back to be reworded; an
// outage comes back with "try again", and the answers stay saved either way.
export function BuildPlanForm({ goalText }: { goalText: string }) {
	const t = useTranslations('Learn.plan.build')
	const [state, formAction, pending] = useActionState(buildPlan, IDLE)
	const [isOffline, setIsOffline] = useState(false)

	if (pending) return <PlanWaiting title={t('pending')} goalText={goalText} />

	if (state.kind === 'unsafe' || state.kind === 'blocked') {
		return (
			<div className="flex flex-col gap-4">
				<p role="alert" className="text-body">
					{t(state.kind)}
				</p>
				<GoalQuestionForm
					question="text"
					defaultAnswer={state.kind === 'unsafe' ? state.saferGoal : goalText}
				/>
			</div>
		)
	}

	const error = isOffline ? t('offline') : state.kind === 'failed' ? t('failed') : null

	return (
		<form
			action={formAction}
			onSubmit={(event) => {
				setIsOffline(!navigator.onLine)
				if (!navigator.onLine) event.preventDefault()
			}}
			className="flex flex-col gap-4"
		>
			<p role="alert" className="text-body text-danger empty:hidden">
				{error}
			</p>
			<Button type="submit" size="lg" className="text-body h-12 w-full">
				{error == null ? t('submit') : t('retry')}
			</Button>
		</form>
	)
}
