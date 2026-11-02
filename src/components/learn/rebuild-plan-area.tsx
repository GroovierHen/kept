'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { rebuildPlan } from '@/server/actions/plan'
import type { BuildPlanState } from '@/server/learn/plan-outcome'
import { PlanWaiting } from './plan-waiting'

const IDLE: BuildPlanState = { kind: 'idle' }

// The plan on screen and its one Try again. While the new plan is written the
// first one stays in view, faded and locked, so the person can still read it;
// on a failure it comes back as it was, and so does the button, since the
// server handed the Try again back.
export function RebuildPlanArea({
	canRebuild,
	children
}: {
	canRebuild: boolean
	children: React.ReactNode
}) {
	const t = useTranslations('Learn.plan.rebuild')
	const [state, formAction, pending] = useActionState(rebuildPlan, IDLE)
	const [isOffline, setIsOffline] = useState(false)
	const error = isOffline ? t('offline') : state.kind === 'failed' ? t('failed') : null

	return (
		<>
			{pending && <PlanWaiting title={t('pending')} />}
			<div
				inert={pending}
				className={cn(
					'flex flex-col gap-4 transition-opacity duration-300',
					pending && 'opacity-40'
				)}
			>
				{children}
			</div>
			{canRebuild && (
				<form
					action={formAction}
					onSubmit={(event) => {
						setIsOffline(!navigator.onLine)
						if (!navigator.onLine) event.preventDefault()
					}}
					className="flex flex-col gap-2"
				>
					<p role="alert" className="text-small text-danger empty:hidden">
						{error}
					</p>
					<Button
						type="submit"
						variant="outline"
						size="lg"
						disabled={pending}
						className="text-body h-12 w-full"
					>
						{pending ? t('pending') : t('submit')}
					</Button>
					<p className="text-small text-text-muted">{t('hint')}</p>
				</form>
			)}
		</>
	)
}
