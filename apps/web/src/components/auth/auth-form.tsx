'use client'

import { useActionState, useId, useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowRightIcon } from '@/components/ui/icons'
import { TallyMark } from '@/components/ui/tally-mark'
import { lift } from '@/components/brand/lift'
import { cn } from '@/lib/cn'
import type { AuthFormState } from '@/server/actions/auth'
import { MAX_EMAIL_LENGTH, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@/lib/credential-limits'

// The email and password form both sign-in pages share. The action returns
// the error to show and the email to keep in the field; on success it
// redirects, so there is no success state here.
export function AuthForm({
	action,
	mode,
	defaultEmail,
	submitLabel,
	pendingLabel
}: {
	action: (previous: AuthFormState, formData: FormData) => Promise<AuthFormState>
	mode: 'sign-up' | 'sign-in'
	defaultEmail: string
	submitLabel: string
	pendingLabel: string
}) {
	const t = useTranslations('Auth')
	const id = useId()
	const [state, formAction, pending] = useActionState(action, {
		error: null,
		email: defaultEmail
	})
	const errorId = `${id}-error`
	const hintId = `${id}-hint`
	const timeZone = useSyncExternalStore(subscribeToNothing, browserTimeZone, serverTimeZone)
	// Offline, the action would fail in the browser and throw to the error page,
	// losing what was typed. Stopping the submit keeps it and says why.
	const [isOffline, setIsOffline] = useState(false)
	const error = isOffline ? t('errors.offline') : state.error
	const [shown, setShown] = useState(false)
	// The password's length, for the meter under it. A finished submit resets
	// the form, so a length typed before the last answer counts as empty.
	const [typed, setTyped] = useState({ state, length: 0 })
	const length = typed.state === state ? typed.length : 0
	const level = passwordLevel(length)
	const passwordId = `${id}-password`

	return (
		<form
			action={formAction}
			onSubmit={(event) => {
				setIsOffline(!navigator.onLine)
				if (!navigator.onLine) event.preventDefault()
			}}
			className="grid gap-[18px]"
			noValidate
		>
			<input type="hidden" name="timeZone" value={timeZone} />
			<div data-reveal className="grid gap-2 delay-[240ms]">
				<Label htmlFor={`${id}-email`} className="text-[14px] font-semibold">
					{t('emailLabel')}
				</Label>
				<Input
					id={`${id}-email`}
					name="email"
					type="email"
					autoComplete="email"
					maxLength={MAX_EMAIL_LENGTH}
					required
					defaultValue={state.email}
					placeholder={t('emailPlaceholder')}
					aria-describedby={error == null ? undefined : errorId}
					aria-invalid={error == null ? undefined : true}
					className={field}
				/>
			</div>
			<div data-reveal className="grid gap-2 delay-[280ms]">
				<Label htmlFor={passwordId} className="text-[14px] font-semibold">
					{t('passwordLabel')}
				</Label>
				<div className="relative">
					<Input
						id={passwordId}
						name="password"
						type={shown ? 'text' : 'password'}
						autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
						required
						minLength={MIN_PASSWORD_LENGTH}
						maxLength={MAX_PASSWORD_LENGTH}
						onChange={(event) => setTyped({ state, length: event.target.value.length })}
						aria-describedby={joinIds(
							mode === 'sign-up' ? hintId : null,
							error == null ? null : errorId
						)}
						aria-invalid={error == null ? undefined : true}
						className={cn(field, 'pr-16')}
					/>
					<button
						type="button"
						aria-controls={passwordId}
						aria-pressed={shown}
						onClick={() => setShown((current) => !current)}
						className="bg-accent-soft text-accent hover:bg-border focus-visible:outline-accent absolute top-1/2 right-2 -translate-y-1/2 rounded-[9px] px-2.5 py-2 text-[13px] font-semibold transition-colors duration-150 focus-visible:outline-2"
					>
						{shown ? t('hide') : t('show')}
					</button>
				</div>
				{mode === 'sign-up' ? (
					<>
						<div aria-hidden className="mt-1 grid grid-cols-4 gap-1.5">
							{[1, 2, 3, 4].map((bar) => (
								<span
									key={bar}
									className={cn(
										'h-[5px] rounded-[5px] transition-colors duration-250',
										bar <= level ? METER[level] : 'bg-border-strong'
									)}
								/>
							))}
						</div>
						<p
							id={hintId}
							className={cn(
								'text-[13px]',
								length >= MIN_PASSWORD_LENGTH ? 'text-success' : 'text-text-faint'
							)}
						>
							{length === 0
								? t('passwordHint')
								: length < MIN_PASSWORD_LENGTH
									? t('passwordMore', { count: MIN_PASSWORD_LENGTH - length })
									: t('passwordGood')}
						</p>
					</>
				) : null}
			</div>

			<p id={errorId} role="alert" className="text-danger text-[15px] empty:hidden">
				{error}
			</p>

			<div data-reveal className="mt-1 delay-[320ms]">
				<Button
					type="submit"
					size="lg"
					disabled={pending}
					className={cn('h-auto w-full gap-2.5 py-4 text-[17px] font-semibold', lift)}
				>
					{pending ? (
						<>
							<TallyMark className="size-5" />
							{pendingLabel}
						</>
					) : (
						<>
							{submitLabel}
							<ArrowRightIcon size={18} />
						</>
					)}
				</Button>
			</div>
		</form>
	)
}

const field =
	'h-auto rounded-[14px] border-[1.5px] border-border-strong px-4 py-[15px] text-[16px] transition-[border-color,box-shadow] duration-150 focus-visible:border-accent focus-visible:shadow-[0_0_0_4px_var(--focus-ring)] focus-visible:outline-none'

// Length alone, against the one rule the server holds a password to: under
// the minimum is one bar, and every three characters past it adds one.
const METER = ['', 'bg-slipped', 'bg-partly', 'bg-kept', 'bg-success']

function passwordLevel(length: number): number {
	if (length === 0) return 0
	if (length < MIN_PASSWORD_LENGTH) return 1
	return Math.min(4, 2 + Math.floor((length - MIN_PASSWORD_LENGTH) / 3))
}

// The server can't know the browser's time zone, so it renders the field empty
// and the browser fills it in after hydrating. Empty falls back on the server.
function subscribeToNothing(): () => void {
	return () => {}
}

function browserTimeZone(): string {
	return Intl.DateTimeFormat().resolvedOptions().timeZone
}

function serverTimeZone(): string {
	return ''
}

function joinIds(...ids: (string | null)[]): string | undefined {
	const joined = ids.filter((value) => value != null).join(' ')
	return joined === '' ? undefined : joined
}
