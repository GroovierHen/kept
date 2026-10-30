// The order of the setup screens (docs/product/walkthrough.md, Day 1). The step
// a user lands on is always worked out from what they've saved, never stored.

export const SETUP_STEPS = ['goal', 'plan', 'keyIdea', 'promise', 'reminder'] as const

export type SetupStep = (typeof SETUP_STEPS)[number]

/** What Learn's `getPlanStatus(userId)` returns. `goal_saved` must mean every goal screen is answered. */
export type PlanStatus = 'no_goal' | 'goal_saved' | 'plan_made' | 'confirmed'

export interface SetupProgress {
	readonly planStatus: PlanStatus
	readonly hasLearnedFirstIdea: boolean
	readonly hasCommittedPromise: boolean
	readonly hasAddedReminder: boolean
}

/** Null once setup is finished. */
export function firstUnfinishedStep(progress: SetupProgress): SetupStep | null {
	if (progress.planStatus === 'no_goal') return 'goal'
	if (progress.planStatus !== 'confirmed') return 'plan'
	if (!progress.hasLearnedFirstIdea) return 'keyIdea'
	if (!progress.hasCommittedPromise) return 'promise'
	if (!progress.hasAddedReminder) return 'reminder'
	return null
}

/** Set on /setup when a step couldn't be saved, so the page can say so. */
export const SAVE_FAILED_PARAM = 'saveFailed'
