import type {
	GoalQuestion,
	PromiseMoment,
	PromiseNudgeKind,
	ReportAnswer,
	SetupStep,
	TodayResponse
} from '@kept/contract'

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
		switchLink: 'Create an account',
		errors: {
			credentials: 'That email and password don’t match an account.',
			offline: 'You’re offline. Try again when you’re back.',
			not_configured: 'Sign-in isn’t set up in this version of the app yet.',
			other: 'We couldn’t sign you in. Try again in a moment.',
			missing: 'Enter your email and password.'
		}
	},
	signUp: {
		heading: 'Make your first promise tonight.',
		support:
			'Two minutes a day. You stay signed in, so tomorrow’s reminder opens straight on today’s screen.',
		email: 'Email',
		emailPlaceholder: 'you@email.com',
		password: 'Password',
		passwordHint: 'At least 8 characters.',
		submit: 'Create account',
		pending: 'Creating your account',
		switch: 'Already have an account?',
		switchLink: 'Sign in',
		errors: {
			email: 'Enter your email address, like you@email.com.',
			password: 'Your password needs at least 8 characters.',
			passwordLong: 'Your password can be at most 72 characters.',
			taken: 'There’s already an account with this email. Sign in instead.',
			weak: 'Your password needs at least 8 characters.',
			confirm: 'Check your inbox to confirm your email, then sign in.',
			busy: 'Too many tries. Wait a minute, then try again.',
			offline: 'You’re offline, so nothing was sent. Try again once you’re connected.',
			not_configured: 'Sign-up isn’t set up in this version of the app yet.',
			other: 'Something went wrong on our side. Try again in a moment.'
		}
	},
	setup: {
		progress: (current: number, total: number) => `Step ${current} of ${total}`,
		steps: {
			goal: 'Your goal',
			plan: 'Your plan',
			keyIdea: 'Your first key idea',
			promise: 'Your promise for tomorrow',
			reminder: 'Your daily reminder'
		} satisfies Record<SetupStep, string>,
		continue: 'Continue',
		goal: {
			progress: (current: number, total: number) => `Question ${current} of ${total}`,
			questions: {
				text: 'What do you want to get better at?',
				weeks: 'How long will you give yourself?',
				startingPoint: 'Where are you now?',
				obstacle: 'What usually gets in your way?'
			} satisfies Record<GoalQuestion, string>,
			hints: {
				text: 'One goal, in your own words. Kept turns it into one small promise a day.',
				weeks: 'Long enough to build the habit. You can’t change this once your plan is made.',
				startingPoint: 'Be honest: the first promises are sized to where you start.',
				obstacle: 'Your plan will work around it.'
			} satisfies Record<GoalQuestion, string>,
			placeholders: {
				text: 'I want to run 5k without stopping.',
				startingPoint: 'I can jog about 1 km, then I have to walk.',
				obstacle: 'I’m tired after work and skip it.'
			},
			examplesLabel: 'Start from one of these:',
			examples: {
				text: ['Run 5k without stopping', 'Read 20 pages a day', 'Hold a conversation in Spanish'],
				startingPoint: [
					'I’ve never really started',
					'I’ve tried and stopped',
					'I do it now and then'
				],
				obstacle: ['I run out of time', 'I lose steam after a week', 'I forget']
			},
			weeksOption: (weeks: number) => `${weeks} weeks`,
			errors: {
				empty: 'Write a few words so we can plan around it.',
				weeks: 'Pick 4, 8 or 12 weeks.'
			}
		},
		plan: {
			buildTitle: 'Ready to make your plan',
			buildBody:
				'Kept turns your answers into milestones, small daily actions and the ideas behind them. It usually takes under 30 seconds.',
			privacy:
				'Your answers are sent through OpenRouter to OpenAI’s GPT-6 Luna to write the plan. Leave out anything private.',
			features: ['Milestones', 'Daily actions, starting small', 'Key ideas, one a day'],
			submit: 'Make my plan',
			pending: 'Writing your plan…',
			slow: 'Still writing. This can take up to a minute.',
			failed:
				'We couldn’t make your plan right now. Your answers are saved; try again in a minute.',
			unsafe:
				'Kept can’t plan that goal safely. Here’s a safer version: use it as it is, or change it.',
			useSafer: 'Use this goal',
			blocked: 'Kept can’t plan this goal. Try putting it another way.',
			changeGoal: 'Change my goal',
			stats: {
				weeks: 'weeks, start to finish',
				actions: (count: number) =>
					`${count === 1 ? 'daily action' : 'daily actions'}, starting small`,
				keyIdeas: (count: number) => `${count === 1 ? 'key idea' : 'key ideas'} to learn, one a day`
			},
			milestones: 'Milestones',
			milestonesHint: 'Where you’ll be along the way.',
			actions: 'Daily actions, starting small',
			actionsHint:
				'Each one starts small and grows as you keep your promises. Reword anything that doesn’t sound like you.',
			week: (week: number) => `Week ${week}`,
			edit: {
				open: 'Edit',
				sizes: { small: 'Start with', medium: 'Then', large: 'Then' },
				save: 'Save',
				cancel: 'Cancel',
				remove: 'Remove this action',
				errors: {
					empty: 'Each step needs a few words, up to 160 characters.',
					lastAction: 'Your plan needs at least one action, so this one stays.'
				}
			},
			rebuild: {
				label: 'Not quite right?',
				hint: 'Get a different plan instead. You can do this once.',
				submit: 'Try again',
				pending: 'Writing a new plan…',
				failed:
					'We couldn’t make a new plan right now. This one is saved, and you can still try again.'
			},
			confirm: 'Confirm my plan',
			confirmHint: 'Once confirmed, your plan stays fixed for the test.'
		},
		keyIdea: {
			lead: 'Each key idea is a reason behind your promises. Kept brings it back as a quick question, so it sticks.'
		},
		promise: {
			lead: 'One small thing, at one moment. Small enough that you’ll keep it even on a bad day.'
		},
		reminder: {
			body: 'Your phone reminds you every day at this time, straight to today’s screen.',
			timeLabel: 'Remind me at',
			submit: 'Turn on my daily reminder',
			denied:
				'Notifications are off for Kept, so the phone can’t remind you. Your time is saved; turn them on in Settings.'
		}
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
	tabs: { today: 'Today', ledger: 'Ledger' },
	ledger: {
		eyebrow: (day: number, goal: string) => `Day ${day} · ${goal}`,
		title: 'Your ledger',
		lead: 'Every promise you’ve made, and what you said about it.',
		promises: {
			title: 'Your promises',
			kept: 'Kept',
			partly: 'Partly',
			slipped: 'Slipped',
			days: (days: readonly number[]) =>
				`${days.length === 1 ? 'day' : 'days'} ${listOf(days.map(String))}`,
			note: 'A Partly counts as half. A promise nobody reported on counts as neither kept nor slipped.'
		},
		days: {
			title: 'Day by day',
			hint: 'Pick a day to see its promise',
			day: (day: number) => `Day ${day}`,
			none: 'You made no promise for this day.',
			outcomes: {
				kept: 'Kept',
				partly: 'Partly',
				slipped: 'Slipped',
				open: 'Not reported yet',
				unreported: 'Not reported',
				noPromise: 'No promise'
			} satisfies Record<Outcome, string>
		},
		sizes: {
			title: 'How your actions changed',
			bigger: 'Getting bigger',
			smaller: 'Getting smaller',
			change: (from: string, to: string, day: number) => `${from} → ${to} on day ${day}`,
			smallerNote: 'Smaller isn’t going backwards. It’s the size you’ll keep.'
		},
		learned: {
			title: 'What you learned',
			scores: (first: number, firstDay: number, last: number, lastDay: number) =>
				`${first} out of 2 on day ${firstDay}, ${last} out of 2 on day ${lastDay}`,
			leftOut: (count: number) =>
				`${count} more ${count === 1 ? 'idea needs' : 'ideas need'} another recall before it shows here.`,
			none: 'Your key ideas show here once you’ve recalled them twice.'
		},
		week: {
			label: 'This week',
			lead: 'Promises you reported on in your last 7 days. A Partly counts as half.'
		},
		milestone: {
			heading: (week: number) => `Next milestone · Week ${week}`,
			week: (week: number) => `Week ${week}`
		},
		stats: {
			daysIn: 'Days in',
			daysOf: (total: number) => `of ${total}`,
			recalled: 'Ideas recalled',
			recalledOf: 'twice or more'
		}
	},
	error: { retry: 'Try again' }
} as const

/** "1, 2 and 3", the way the web's list format reads in English. */
function listOf(items: readonly string[]): string {
	if (items.length <= 1) return items.join('')
	return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}
