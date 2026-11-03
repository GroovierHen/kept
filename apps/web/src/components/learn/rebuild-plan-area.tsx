'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { SETUP_SECONDARY_BUTTON } from '@/components/setup/setup-styles'
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
			{pending && (
				<div className="border-border bg-surface mt-3 mb-2 rounded-[20px] border p-5">
					<PlanWaiting title={t('pending')} />
				</div>
			)}
			<div
				inert={pending}
				className={cn('flex flex-col transition-opacity duration-300', pending && 'opacity-40')}
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
					className="mt-4 flex flex-wrap items-center justify-between gap-3 px-1"
				>
					<p className="text-text-muted flex-[1_1_260px] text-[15px] leading-normal">
						<strong className="text-text font-semibold">{t('label')}</strong> {t('hint')}
					</p>
					<Button
						type="submit"
						variant="outline"
						disabled={pending}
						className={SETUP_SECONDARY_BUTTON}
					>
						{pending ? t('pending') : t('submit')}
					</Button>
					<p role="alert" className="text-danger basis-full text-[14px] empty:hidden">
						{error}
					</p>
				</form>
			)}
		</>
	)
}
