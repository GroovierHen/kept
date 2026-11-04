// Plain values both apps check input against, free of Zod, so a web form can
// import them without pulling a schema library into the browser
// (`@kept/contract/limits`).

/** The goal's four setup questions, in the order they're asked. */
export const GOAL_QUESTIONS = ['text', 'weeks', 'startingPoint', 'obstacle'] as const
export type GoalQuestion = (typeof GOAL_QUESTIONS)[number]

/** How long a plan can run. */
export const PLAN_WEEKS = [4, 8, 12] as const
export type PlanWeeks = (typeof PLAN_WEEKS)[number]

/** The goals table's VarChar(280) columns. */
export const MAX_GOAL_ANSWER_LENGTH = 280

/** The plan_actions table's VarChar(160) columns. */
export const MAX_ACTION_LENGTH = 160

/** The order of the setup screens; a person lands on the first unfinished one. */
export const SETUP_STEPS = ['goal', 'plan', 'keyIdea', 'promise', 'reminder'] as const
export type SetupStep = (typeof SETUP_STEPS)[number]

/** Supabase Auth's own floor, checked before anything is sent. */
export const MIN_PASSWORD_LENGTH = 8
/** Supabase Auth refuses longer passwords, so they are caught with a clear message. */
export const MAX_PASSWORD_LENGTH = 72
/** The longest address the email standard allows. */
export const MAX_EMAIL_LENGTH = 254
