import type { GeneratedPlan } from '@/lib/learn/plan'
import type { PlanResult } from './planner'

// What the plan step does with each planner result (#30). Kept apart from the
// server action so every branch is tested without the AI or a database.

export type BuildPlanState =
	| { readonly kind: 'idle' }
	| { readonly kind: 'unsafe'; readonly saferGoal: string }
	| { readonly kind: 'blocked' }
	| { readonly kind: 'failed' }

export type PlanOutcome =
	{ readonly save: GeneratedPlan } | { readonly state: BuildPlanState; readonly report?: unknown }

export function outcomeOf(result: PlanResult): PlanOutcome {
	if (result.ok) return { save: result.plan }
	switch (result.reason) {
		// The AI doing its job, not a fault: the person sees a safer goal.
		case 'unsafe':
			return { state: { kind: 'unsafe', saferGoal: result.saferGoal } }
		// Moderation doing its job: the person rewords the goal. Try again
		// would only be flagged again.
		case 'blocked':
			return { state: { kind: 'blocked' } }
		case 'unavailable':
			return { state: { kind: 'failed' }, report: result.error }
		case 'invalid':
			return {
				state: { kind: 'failed' },
				report: new Error('The planner gave a plan in the wrong shape twice')
			}
	}
}
