'use client'

import { useActionState, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { Textarea } from '@/components/ui/textarea'
import { MAX_PROMISE_LENGTH, PROMISE_MOMENTS, type PromiseMoment } from '@/lib/promise'
import { commitPromise, type PromiseFormState } from '@/server/actions/setup'

const INITIAL_STATE: PromiseFormState = { error: null }

export function PromiseForm({ actions }: { actions: { id: string; wording: string }[] }) {
	const t = useTranslations('SetupPage.promise')
	const id = useId()
	const [state, formAction, pending] = useActionState(commitPromise, INITIAL_STATE)
	const [actionId, setActionId] = useState<string | null>(actions[0]?.id ?? null)
	const [isTyping, setIsTyping] = useState(actions.length === 0)
	const [typed, setTyped] = useState('')
	const [moment, setMoment] = useState<PromiseMoment | null>(null)
	const [isOffline, setIsOffline] = useState(false)

	const chosen = actions.find((action) => action.id === actionId)?.wording
	const wording = isTyping ? typed.trim() : chosen
	const error = isOffline ? t('errors.offline') : state.error
	const errorId = `${id}-error`

	return (
		<form
			action={formAction}
			onSubmit={(event) => {
				setIsOffline(!navigator.onLine)
				if (!navigator.onLine) event.preventDefault()
			}}
			className="flex flex-col gap-4"
			noValidate
		>
			<input type="hidden" name="kind" value={isTyping ? 'typed' : 'action'} />
			<input type="hidden" name="moment" value={moment ?? ''} />
			<input type="hidden" name="actionId" value={actionId ?? ''} />

			{isTyping ? (
				<Textarea
					name="wording"
					aria-label={t('typedLabel')}
					aria-describedby={error == null ? undefined : errorId}
					placeholder={t('typedPlaceholder')}
					value={typed}
					onChange={(event) => setTyped(event.target.value)}
					maxLength={MAX_PROMISE_LENGTH}
					rows={2}
					className="text-body"
				/>
			) : (
				<ChoiceGroup
					label={t('actionsLabel')}
					layout="stack"
					choices={actions.map((action) => ({ value: action.id, label: action.wording }))}
					value={actionId}
					onChange={setActionId}
				/>
			)}
			{actions.length > 0 && (
				<Button
					type="button"
					variant="ghost"
					className="self-start"
					onClick={() => setIsTyping(!isTyping)}
				>
					{isTyping ? t('useAction') : t('typeMyOwn')}
				</Button>
			)}

			<div className="flex flex-col gap-2">
				<h3 className="text-small font-semibold">{t('momentLabel')}</h3>
				<ChoiceGroup
					label={t('momentLabel')}
					className="grid-flow-row grid-cols-2"
					choices={PROMISE_MOMENTS.map((value) => ({ value, label: t(`moments.${value}`) }))}
					value={moment}
					onChange={setMoment}
				/>
			</div>

			{moment != null && wording != null && wording !== '' && (
				<p className="text-body font-medium">{t(`sentences.${moment}`, { wording })}</p>
			)}

			<p id={errorId} role="alert" className="text-body text-danger empty:hidden">
				{error}
			</p>

			<Button
				type="submit"
				size="lg"
				disabled={pending || moment == null || wording == null || wording === ''}
				className="text-body h-12 w-full"
			>
				{pending ? t('saving') : t('commit')}
			</Button>
		</form>
	)
}
