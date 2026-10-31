'use client'

import { useActionState, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionSize } from '@/lib/learn/plan'
import { MAX_ACTION_LENGTH } from '@/lib/learn/plan-limits'
import { editPlanAction, type ActionEditState } from '@/server/actions/plan'

const INITIAL_STATE: ActionEditState = { error: null }
const SIZES: readonly ActionSize[] = ['small', 'medium', 'large']

// One action's Edit panel on the plan step: reword its three sizes, or remove
// it while it isn't the last. Closed until opened, so the plan reads first.
export function ActionEditor({
	action,
	canRemove
}: {
	action: { id: string } & Record<ActionSize, string>
	canRemove: boolean
}) {
	const t = useTranslations('Learn.plan.edit')
	const id = useId()
	const [state, formAction, pending] = useActionState(editPlanAction, INITIAL_STATE)
	const [isOffline, setIsOffline] = useState(false)
	const error = isOffline ? t('errors.offline') : state.error

	return (
		<details className="group">
			<summary className="text-small text-accent w-fit cursor-pointer">{t('open')}</summary>
			<form
				action={formAction}
				onSubmit={(event) => {
					setIsOffline(!navigator.onLine)
					if (!navigator.onLine) event.preventDefault()
				}}
				className="mt-3 flex flex-col gap-3"
			>
				<input type="hidden" name="actionId" value={action.id} />
				{SIZES.map((size) => (
					<div key={size} className="flex flex-col gap-1">
						<Label htmlFor={`${id}-${size}`}>{t(`sizes.${size}`)}</Label>
						<Input
							id={`${id}-${size}`}
							name={size}
							defaultValue={action[size]}
							maxLength={MAX_ACTION_LENGTH}
							required
						/>
					</div>
				))}
				<p role="alert" className="text-small text-danger empty:hidden">
					{error}
				</p>
				<div className="flex gap-2">
					<Button type="submit" name="intent" value="save" disabled={pending}>
						{pending ? t('saving') : t('save')}
					</Button>
					{canRemove && (
						<Button
							type="submit"
							name="intent"
							value="remove"
							variant="ghost"
							disabled={pending}
							formNoValidate
						>
							{t('remove')}
						</Button>
					)}
				</div>
			</form>
		</details>
	)
}
