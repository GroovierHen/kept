'use client'

import { useActionState, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { EditIcon } from '@/components/ui/icons'
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
			<summary className="border-border-strong text-text hover:bg-surface-hover focus-visible:outline-accent flex h-10 w-fit cursor-pointer list-none items-center gap-2 rounded-xl border px-3.5 text-[14px] font-semibold group-open:mb-3 focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden">
				<EditIcon size={16} />
				{t('open')}
			</summary>
			<form
				action={formAction}
				onSubmit={(event) => {
					setIsOffline(!navigator.onLine)
					if (!navigator.onLine) event.preventDefault()
				}}
				className="flex flex-col gap-3"
			>
				<input type="hidden" name="actionId" value={action.id} />
				{SIZES.map((size) => (
					<div key={size} className="flex flex-col gap-1.5">
						<Label htmlFor={`${id}-${size}`} className="text-[13px] font-semibold">
							{t(`sizes.${size}`)}
						</Label>
						<Input
							id={`${id}-${size}`}
							name={size}
							defaultValue={action[size]}
							maxLength={MAX_ACTION_LENGTH}
							required
							className="border-border-strong h-12 rounded-xl text-[16px]"
						/>
					</div>
				))}
				<p role="alert" className="text-danger text-[14px] empty:hidden">
					{error}
				</p>
				<div className="flex flex-wrap items-center gap-2.5">
					<Button
						type="submit"
						name="intent"
						value="save"
						disabled={pending}
						className="h-12 rounded-xl px-[22px] text-[15px] font-semibold"
					>
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
							className="text-danger hover:bg-surface-hover ml-auto h-11 text-[14px] font-semibold"
						>
							{t('remove')}
						</Button>
					)}
				</div>
			</form>
		</details>
	)
}
