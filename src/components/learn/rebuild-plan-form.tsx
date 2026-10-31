'use client'

import { useActionState, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { rebuildPlan } from '@/server/actions/plan'
import type { BuildPlanState } from '@/server/learn/plan-outcome'

const IDLE: BuildPlanState = { kind: 'idle' }

// The one Try again. On a failure the plan on screen stays, and so does the
// button, since the server handed the Try again back.
export function RebuildPlanForm() {
	const t = useTranslations('Learn.plan.rebuild')
	const [state, formAction, pending] = useActionState(rebuildPlan, IDLE)
	const [isOffline, setIsOffline] = useState(false)
	const error = isOffline ? t('offline') : state.kind === 'failed' ? t('failed') : null

	return (
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
	)
}
