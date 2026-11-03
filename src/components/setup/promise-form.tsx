'use client'

import { useActionState, useId, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ChoiceGroup } from '@/components/ui/choice-group'
import { ArrowRightIcon } from '@/components/ui/icons'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/cn'
import { MAX_PROMISE_LENGTH, PROMISE_MOMENTS, type PromiseMoment } from '@/lib/promise'
import type { PromiseFormState } from '@/server/actions/setup'
import { AsideCard, SetupAside, SetupMain } from './setup-layout'
import { SETUP_BUTTON, SETUP_CHOICE, SETUP_FIELD, SETUP_TILE } from './setup-styles'

const INITIAL_STATE: PromiseFormState = { error: null }
const ANSWERS = ['yes', 'partly', 'no'] as const

export function PromiseForm({
	actions,
	submit,
	initial,
	submitLabel,
	screen
}: {
	actions: { id: string; wording: string }[]
	submit: (previous: PromiseFormState, formData: FormData) => Promise<PromiseFormState>
	/** What comes pre-selected. Setup leaves it out, so the first action is selected. */
	initial?: { actionId?: string; typed?: string; moment: PromiseMoment }
	submitLabel?: string
	/**
	 * Lays the form out as a whole screen under this heading, the sentence on the
	 * green panel. `footer` follows the form, so it may hold forms of its own.
	 */
	screen?: {
		heading: React.ReactNode
		lead?: React.ReactNode
		footer?: React.ReactNode
		aside?: React.ReactNode
	}
}) {
	const t = useTranslations('SetupPage.promise')
	const id = useId()
	const [state, formAction, pending] = useActionState(submit, INITIAL_STATE)
	const [actionId, setActionId] = useState<string | null>(
		initial?.actionId ?? actions[0]?.id ?? null
	)
	const [isTyping, setIsTyping] = useState(actions.length === 0 || initial?.typed != null)
	const [typed, setTyped] = useState(initial?.typed ?? '')
	const [moment, setMoment] = useState<PromiseMoment | null>(initial?.moment ?? null)
	const [isOffline, setIsOffline] = useState(false)

	const chosen = actions.find((action) => action.id === actionId)?.wording
	const wording = isTyping ? typed.trim() : chosen
	const error = isOffline ? t('errors.offline') : state.error
	const errorId = `${id}-error`
	const sentence =
		moment != null && wording != null && wording !== ''
			? t(`sentences.${moment}`, { wording })
			: null
	const isSetup = screen != null

	const actionPicker = isTyping ? (
		<Textarea
			name="wording"
			aria-label={t('typedLabel')}
			aria-describedby={error == null ? undefined : errorId}
			placeholder={t('typedPlaceholder')}
			value={typed}
			onChange={(event) => setTyped(event.target.value)}
			maxLength={MAX_PROMISE_LENGTH}
			rows={2}
			className={isSetup ? SETUP_FIELD : 'text-body'}
		/>
	) : (
		<ChoiceGroup
			label={t('actionsLabel')}
			layout="stack"
			itemClassName={isSetup ? SETUP_CHOICE : undefined}
			choices={actions.map((action, index) => ({
				value: action.id,
				label: !isSetup ? (
					action.wording
				) : (
					<span className="flex items-center justify-between gap-3">
						<span className="first-letter:uppercase">{action.wording}</span>
						{index === 0 && (
							<span className="bg-coral-soft text-coral-deep flex-none rounded-full px-2.5 py-1 text-[12px] font-semibold">
								{t('firstAction')}
							</span>
						)}
					</span>
				)
			}))}
			value={actionId}
			onChange={setActionId}
		/>
	)
	const typeToggle = actions.length > 0 && (
		<Button
			type="button"
			variant="ghost"
			className={cn('self-start', isSetup && 'text-accent min-h-11 px-1 text-[15px] underline')}
			onClick={() => setIsTyping(!isTyping)}
		>
			{isTyping ? t('useAction') : t('typeMyOwn')}
		</Button>
	)
	const momentPicker = (
		<ChoiceGroup
			label={t('momentLabel')}
			className={isSetup ? 'grid-flow-row grid-cols-2 sm:grid-cols-4' : 'grid-flow-row grid-cols-2'}
			itemClassName={isSetup ? cn(SETUP_TILE, 'min-h-24 text-[16px] font-semibold') : undefined}
			choices={PROMISE_MOMENTS.map((value) => ({ value, label: t(`moments.${value}`) }))}
			value={moment}
			onChange={setMoment}
		/>
	)
	const errorLine = (
		<p
			id={errorId}
			role="alert"
			className={cn('text-danger empty:hidden', isSetup ? 'text-[15px]' : 'text-body')}
		>
			{error}
		</p>
	)
	const isDisabled = pending || moment == null || wording == null || wording === ''
	const hiddenInputs = (
		<>
			<input type="hidden" name="kind" value={isTyping ? 'typed' : 'action'} />
			<input type="hidden" name="moment" value={moment ?? ''} />
			<input type="hidden" name="actionId" value={actionId ?? ''} />
		</>
	)
	const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
		setIsOffline(!navigator.onLine)
		if (!navigator.onLine) event.preventDefault()
	}

	if (isSetup) {
		return (
			<>
				<SetupMain>
					{screen.heading}
					<p className="text-text-muted max-w-[52ch] text-[17px] leading-[1.55]">
						{screen.lead ?? t('lead')}
					</p>
					<form action={formAction} onSubmit={onSubmit} className="flex flex-col" noValidate>
						{hiddenInputs}
						<h2 className="mt-8 mb-3 text-[16px] font-semibold">{t('actionsLabel')}</h2>
						{actionPicker}
						<div className="mt-2">{typeToggle}</div>
						<h2 className="mt-6 mb-3 text-[16px] font-semibold">{t('momentLabel')}</h2>
						{momentPicker}
						<div className="mt-6">{errorLine}</div>
						<Button type="submit" disabled={isDisabled} className={cn(SETUP_BUTTON, 'mt-4')}>
							{pending ? t('saving') : (submitLabel ?? t('commit'))}
							{!pending && <ArrowRightIcon size={18} />}
						</Button>
					</form>
					{screen.footer}
				</SetupMain>
				<SetupAside label={t('asideLabel')} lead={t('asideLead')}>
					<AsideCard className="p-0">
						<div className="px-6 pt-6 pb-5">
							<p className="text-text-faint text-[13px] font-medium">
								{t('tomorrow', {
									moment: moment == null ? t('pickMoment') : t(`moments.${moment}`)
								})}
							</p>
							<p
								className={cn(
									'face-display mt-4 text-[clamp(28px,2.6vw,36px)] leading-[1.08] font-extrabold',
									sentence == null && 'text-text-faint'
								)}
							>
								{sentence ?? t('empty')}
							</p>
						</div>
						<div aria-hidden className="border-border mx-6 border-t-2 border-dashed" />
						<div className="flex flex-col gap-3 px-6 pt-[18px] pb-6">
							<p className="text-text-faint text-[13px] font-medium">{t('asks')}</p>
							<ul className="grid grid-cols-3 gap-2">
								{ANSWERS.map((answer) => (
									<li
										key={answer}
										className={cn(
											'rounded-xl border-[1.5px] px-3 py-2.5 text-center text-[14px] font-semibold',
											answer === 'yes'
												? 'border-success bg-kept-soft'
												: 'border-border text-text-muted'
										)}
									>
										{t(`answers.${answer}`)}
									</li>
								))}
							</ul>
						</div>
					</AsideCard>
					{screen.aside}
				</SetupAside>
			</>
		)
	}

	return (
		<form action={formAction} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
			{hiddenInputs}

			{actionPicker}
			{typeToggle}

			<div className="flex flex-col gap-2">
				<h3 className="text-small font-semibold">{t('momentLabel')}</h3>
				{momentPicker}
			</div>

			{sentence != null && <p className="text-body font-medium">{sentence}</p>}

			{errorLine}

			<Button type="submit" size="lg" disabled={isDisabled} className="text-body h-12 w-full">
				{pending ? t('saving') : (submitLabel ?? t('commit'))}
			</Button>
		</form>
	)
}
