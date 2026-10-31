'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { buildPlan } from '@/server/actions/plan'
import type { BuildPlanState } from '@/server/learn/plan-outcome'
import { GoalQuestionForm } from './goal-question-form'

const IDLE: BuildPlanState = { kind: 'idle' }

// The one button that sends the goal to Gemini. A goal Gemini won't plan
// comes back with a safer version, ready to use or rewrite; an outage comes
// back with "try again", and the answers stay saved either way.
export function BuildPlanForm() {
	const t = useTranslations('Learn.plan.build')
	const [state, formAction, pending] = useActionState(buildPlan, IDLE)
	const [isOffline, setIsOffline] = useState(false)

	if (state.kind === 'unsafe') {
		return (
			<div className="flex flex-col gap-4">
				<p role="alert" className="text-body">
					{t('unsafe')}
				</p>
				<GoalQuestionForm question="text" defaultAnswer={state.saferGoal} />
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
			<Button type="submit" size="lg" disabled={pending} className="text-body h-12 w-full">
				{pending ? t('pending') : error == null ? t('submit') : t('retry')}
			</Button>
		</form>
	)
}
