import type { TodayResponse } from '@kept/contract'

// The app's words, matching the web app's (apps/web/messages/en.json) so a
// person reads the same thing on either. English only for now.

type Step = TodayResponse['step']
type Outcome = TodayResponse['strip'][number]['outcome']
type Moment = NonNullable<TodayResponse['promise']>['moment']
type Status = NonNullable<TodayResponse['promise']>['status']

export const copy = {
	signIn: {
		heading: 'Back to today’s promise.',
		support: 'Sign in once and you stay signed in for 30 days.',
		email: 'Email',
		password: 'Password',
		submit: 'Sign in',
		pending: 'Signing you in',
		switch: 'New to Kept?',
		switchLink: 'Create an account on the web',
		errors: {
			credentials: 'That email and password don’t match an account.',
			offline: 'You’re offline. Try again when you’re back.',
			not_configured: 'Sign-in isn’t set up in this version of the app yet.',
			other: 'We couldn’t sign you in. Try again in a moment.',
			missing: 'Enter your email and password.'
		}
	},
	finishSetup: {
		heading: 'Finish setting up on the web.',
		support:
			'Your goal, your plan and your first promise are set up on the Kept website. Once that’s done, your check-ins live here too.',
		open: 'Continue setup',
		refresh: 'I’ve finished'
	},
	today: {
		day: (day: number) => `Day ${day}`,
		steps: {
			report: 'Report back',
			learn: 'Learn one idea',
			commit: 'Your next promise',
			done: 'Done for today'
		} satisfies Record<Step, string>,
		stepLead: {
			report: 'Report back on your promise.',
			learn: 'Learn one idea, then say it back.',
			commit: 'Promise one small thing for tomorrow.',
			done: 'We’ll ask how it went at your next check-in.'
		} satisfies Record<Step, string>,
		continueOnWeb: 'Check in on the web',
		promiseLabel: {
			dueToday: 'Today’s promise',
			dueYesterday: 'Yesterday’s promise',
			upcoming: 'Your next promise',
			unreported: 'Your last promise'
		} satisfies Record<Status, string>,
		moments: {
			wake_up: 'Wake up',
			lunch: 'Lunch',
			after_work: 'After work',
			before_bed: 'Before bed'
		} satisfies Record<NonNullable<Moment>, string>,
		week: {
			heading: 'Last 7 days',
			kept: (kept: number, total: number) =>
				`${kept} of ${total} ${total === 1 ? 'promise' : 'promises'} kept`,
			none: 'Nothing reported in your last 7 days yet.',
			outcomes: {
				kept: 'Kept',
				partly: 'Partly',
				slipped: 'Slipped',
				open: 'Not reported yet',
				unreported: 'No report',
				noPromise: 'No promise'
			} satisfies Record<Outcome, string>
		},
		milestone: {
			heading: 'Next milestone',
			due: (days: number) =>
				days === 0 ? 'Due today' : days === 1 ? 'Due in 1 day' : `Due in ${days} days`
		},
		reminder: {
			ask: (time: string) => `Remind me every day at ${time}`,
			on: (time: string) => `Your daily reminder is on for ${time}.`,
			off: 'Reminders are off for Kept. Turn them on in Settings.',
			settings: 'Open Settings'
		},
		signOut: 'Sign out'
	},
	error: { retry: 'Try again' }
} as const
