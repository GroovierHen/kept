// Plain values shared by the goal screens and the server's checks, kept free
// of Zod so the form doesn't pull it into the browser.

export const GOAL_QUESTIONS = ['text', 'weeks', 'startingPoint', 'obstacle'] as const
export type GoalQuestion = (typeof GOAL_QUESTIONS)[number]

export const PLAN_WEEKS = [4, 8, 12] as const

// The goals table's VarChar(280) columns.
export const MAX_GOAL_ANSWER_LENGTH = 280
