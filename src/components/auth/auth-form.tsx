'use client'

import { useActionState, useId, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { AuthFormState } from '@/server/actions/auth'

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

	return (
		<form action={formAction} className="flex flex-col gap-6" noValidate>
			<input type="hidden" name="timeZone" value={timeZone} />
			<div data-reveal className="flex flex-col gap-2 delay-[140ms]">
				<Label htmlFor={`${id}-email`} className="text-body font-normal">
					{t('emailLabel')}
				</Label>
				<Input
					id={`${id}-email`}
					name="email"
					type="email"
					autoComplete="email"
					required
					defaultValue={state.email}
					aria-describedby={state.error == null ? undefined : errorId}
					aria-invalid={state.error == null ? undefined : true}
					className="text-body h-12 px-4"
				/>
			</div>
			<div data-reveal className="flex flex-col gap-2 delay-[210ms]">
				<Label htmlFor={`${id}-password`} className="text-body font-normal">
					{t('passwordLabel')}
				</Label>
				<Input
					id={`${id}-password`}
					name="password"
					type="password"
					autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
					required
					minLength={8}
					aria-describedby={joinIds(
						mode === 'sign-up' ? hintId : null,
						state.error == null ? null : errorId
					)}
					aria-invalid={state.error == null ? undefined : true}
					className="text-body h-12 px-4"
				/>
				{mode === 'sign-up' ? (
					<p id={hintId} className="text-small text-text-muted">
						{t('passwordHint')}
					</p>
				) : null}
			</div>

			<p id={errorId} role="alert" className="text-body text-danger empty:hidden">
				{state.error}
			</p>

			<div data-reveal className="delay-[280ms]">
				<Button type="submit" size="lg" disabled={pending} className="text-body h-12 w-full">
					{pending ? pendingLabel : submitLabel}
				</Button>
			</div>
		</form>
	)
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
