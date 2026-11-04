import { z } from 'zod'
import {
	GOAL_QUESTIONS,
	MAX_ACTION_LENGTH,
	MAX_GOAL_ANSWER_LENGTH,
	PLAN_WEEKS,
	SETUP_STEPS
} from './limits.ts'

// Setup, one screen at a time (docs/product/walkthrough.md, Day 1): the goal's
// four questions, the plan the AI makes from them, the first key idea, the
// first Promise and the daily reminder. The step is worked out from what's
// saved, never stored, so GET /setup always says where the person is.

// ── What each step sends ──────────────────────────────────────────────────

const writtenAnswer = z.string().trim().min(1).max(MAX_GOAL_ANSWER_LENGTH)

/** One goal screen's answer. Answering again overwrites it, until a plan exists. */
export const goalAnswerInput = z.discriminatedUnion('question', [
	z.strictObject({ question: z.literal('text'), answer: writtenAnswer }),
	z.strictObject({ question: z.literal('weeks'), answer: z.literal(PLAN_WEEKS) }),
	z.strictObject({ question: z.literal('startingPoint'), answer: writtenAnswer }),
	z.strictObject({ question: z.literal('obstacle'), answer: writtenAnswer })
])
export type GoalAnswerInput = z.infer<typeof goalAnswerInput>

const actionWording = z.string().trim().min(1).max(MAX_ACTION_LENGTH)

/** An action's three sizes, as the AI writes them and as the person rewords them. */
export const actionSizes = z.strictObject({
	small: actionWording,
	medium: actionWording,
	large: actionWording
})

/** Reword an action's three sizes, or remove it, before the plan is confirmed. */
export const planActionEdit = z.discriminatedUnion('intent', [
	z.strictObject({ intent: z.literal('save'), actionId: z.uuid(), sizes: actionSizes }),
	z.strictObject({ intent: z.literal('remove'), actionId: z.uuid() })
])
export type PlanActionEdit = z.infer<typeof planActionEdit>

/** "HH:MM", 24-hour, in the person's own time zone. */
export const reminderTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)

export const reminderInput = z.object({ time: reminderTime })

export const firstKeyIdeaInput = z.object({ keyIdeaId: z.uuid() })

// ── What the writes answer ────────────────────────────────────────────────

/**
 * Making the plan: `saved` (setup moves on), `skipped` (nothing to build, or a
 * build is already running: read setup again), or why the AI made none.
 * `unsafe` comes with a safer wording of the goal to use or change.
 */
export const planBuildResult = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('saved') }),
	z.object({ kind: z.literal('skipped') }),
	z.object({ kind: z.literal('unsafe'), saferGoal: z.string() }),
	z.object({ kind: z.literal('blocked') }),
	z.object({ kind: z.literal('failed') })
])
export type PlanBuildResult = z.infer<typeof planBuildResult>

/** `locked`: confirmed elsewhere. `last_action`: a plan keeps at least one. */
export const planEditResult = z.object({ result: z.enum(['saved', 'locked', 'last_action']) })

// ── What each step shows ──────────────────────────────────────────────────

const goalAnswers = z.object({
	text: z.string().nullable(),
	weeks: z.int().nullable(),
	startingPoint: z.string().nullable(),
	obstacle: z.string().nullable()
})

const planDraft = z.object({
	goal: z.object({ text: z.string().nullable(), weeks: z.int().nullable() }),
	milestones: z.array(z.object({ id: z.string(), week: z.int(), text: z.string() })),
	actions: z.array(
		z.object({ id: z.string(), small: z.string(), medium: z.string(), large: z.string() })
	),
	keyIdeaCount: z.int().min(0),
	/** One Try again per plan. */
	canRebuild: z.boolean()
})

export const setupView = z.discriminatedUnion('step', [
	z.object({
		step: z.literal('goal'),
		/** The first question still unanswered. */
		question: z.enum(GOAL_QUESTIONS),
		answers: goalAnswers
	}),
	z.object({
		step: z.literal('plan'),
		plan: z.discriminatedUnion('status', [
			z.object({
				status: z.literal('goal_saved'),
				goalText: z.string(),
				/** A build already running (another tap, another device): wait, then read again. */
				isBuilding: z.boolean()
			}),
			z.object({ status: z.literal('plan_made'), draft: planDraft })
		])
	}),
	z.object({
		step: z.literal('keyIdea'),
		lesson: z.object({ keyIdeaId: z.string(), title: z.string(), lesson: z.string() }).nullable()
	}),
	z.object({
		step: z.literal('promise'),
		/** Each Action at its small Size, the first one picked. */
		actions: z.array(z.object({ id: z.string(), wording: z.string() }))
	}),
	z.object({ step: z.literal('reminder') }),
	z.object({ step: z.literal('done') })
])
export type SetupView = z.infer<typeof setupView>

export const setupResponse = z.object({
	/** "Step n of 5" counts from here. */
	steps: z.array(z.enum(SETUP_STEPS)),
	view: setupView
})
export type SetupResponse = z.infer<typeof setupResponse>
