import type { PromiseMoment, PromiseNudgeKind, ReportAnswer, TodayResponse } from '@kept/contract'

// The app's words, matching the web app's (apps/web/messages/en.json) so a
// person reads the same thing on either. English only for now.

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
	report: {
		question: (when: 'today' | 'yesterday', wording: string) => `Did you ${wording} ${when}?`,
		when: (when: 'today' | 'yesterday', moment: string) =>
			`${when === 'today' ? 'Today' : 'Yesterday'} · ${moment}`,
		lead: 'One tap. An honest answer keeps your next promise the right size.',
		answers: { yes: 'Yes', partly: 'Partly', no: 'No' } satisfies Record<ReportAnswer, string>,
		details: {
			yes: 'I did all of it',
			partly: 'I did some of it',
			no: 'Not this time'
		} satisfies Record<ReportAnswer, string>,
		note: 'A Partly counts as half. You can change your answer until 4am.',
		unreportedNote: 'Your last promise closed as Unreported. It doesn’t count for or against you.',
		change: {
			summary: (answer: string) => `You answered ${answer}. Change my answer`,
			hint: 'You can change it until 4am.'
		}
	},
	recall: {
		eyebrow: (title: string) => `Remember: ${title}`,
		lead: 'Answer from memory, in your own words.',
		answerLabel: 'Your answer',
		placeholder: 'In your own words…',
		submit: 'Check my answer',
		marking: 'Marking…',
		score: (score: number) => `${score} out of 2`,
		choiceRight: 'Right.',
		choiceWrong: 'Not this time. It comes back tomorrow.',
		modelAnswer: 'Model answer',
		continue: 'Continue',
		choosingHint: 'We can’t mark typed answers right now, so pick the best answer instead.',
		errors: { choose: 'Pick one answer.' }
	},
	lesson: { eyebrow: 'Key idea', learned: 'Learned today', continue: 'Continue' },
	promise: {
		actionsLabel: 'Which action will you promise?',
		typeMyOwn: 'Type my own',
		useAction: 'Pick from my plan instead',
		typedLabel: 'Your own promise',
		typedPlaceholder: 'walk for 10 minutes',
		momentLabel: 'When will you do it?',
		moments: {
			wake_up: 'Wake up',
			lunch: 'Lunch',
			after_work: 'After work',
			before_bed: 'Before bed'
		} satisfies Record<PromiseMoment, string>,
		sentences: {
			wake_up: (wording: string) => `When I wake up, I will ${wording}.`,
			lunch: (wording: string) => `At lunch, I will ${wording}.`,
			after_work: (wording: string) => `After work, I will ${wording}.`,
			before_bed: (wording: string) => `Before bed, I will ${wording}.`
		} satisfies Record<PromiseMoment, (wording: string) => string>,
		empty: 'Pick an action and a moment.',
		commit: 'Make my promise',
		errors: {
			invalid: 'Pick a moment, and write up to 160 characters if you’re typing your own.'
		}
	},
	commit: {
		title: 'Your next promise',
		lead: 'Your last promise is already picked, so keeping it is one tap. Change it if tomorrow looks different.',
		reminder: 'Your daily reminder already covers it.',
		nudge: {
			differentAction:
				'That was two Noes at the smallest size, so here’s a different action from your plan. You can still pick the old one.',
			typeSmaller: 'That was two Noes on this one. Try typing a smaller version.'
		} satisfies Record<PromiseNudgeKind, string>
	},
	done: {
		title: 'Done for today',
		nextCheckIn: 'We’ll ask how it went at your next check-in.',
		change: {
			summary: 'Change this promise',
			hint: 'You can change it until 4am.',
			submit: 'Change my promise'
		}
	},
	error: { retry: 'Try again' }
} as const
