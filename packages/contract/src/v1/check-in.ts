import { z } from 'zod'
import { keptDay, PROMISE_MOMENTS } from './common.ts'

// The Check-in's steps (GLOSSARY.md): what each one sends, and what the Today
// screen needs to show it. The web's server actions parse the same input
// schemas, so a rule like a Promise's length is written once for both apps.

export type PromiseMoment = (typeof PROMISE_MOMENTS)[number]

// ── Report ────────────────────────────────────────────────────────────────

export const REPORT_ANSWERS = ['yes', 'partly', 'no'] as const
export type ReportAnswer = (typeof REPORT_ANSWERS)[number]

/** What the report step sends. The id is made by the screen that asked, so a retry saves once. */
export const reportSubmission = z.object({
	promiseId: z.uuid(),
	reportId: z.uuid(),
	answer: z.enum(REPORT_ANSWERS)
})
export type ReportSubmission = z.infer<typeof reportSubmission>

const SECOND_PERSON: Record<string, string> = { my: 'your', mine: 'yours', myself: 'yourself' }

/**
 * A Promise's wording as it reads inside "Did you … today?". Typed wording is
 * free text, so it may repeat the whole sentence the form shows.
 */
export function reportQuestionWording(wording: string): string {
	return wording
		.trim()
		.replace(/^(?:[^,]*,\s*)?i(?: will|'ll|’ll)\s+/i, '')
		.replace(/[.!]+$/, '')
		.replace(/^[A-Z](?=[a-z])/, (letter) => letter.toLowerCase())
		.replace(/\b(my|mine|myself)\b/gi, (word) => SECOND_PERSON[word.toLowerCase()] ?? word)
}

// ── Promise ───────────────────────────────────────────────────────────────

/** The same limit as an action's wording. */
export const MAX_PROMISE_LENGTH = 160

const moment = z.enum(PROMISE_MOMENTS)

/** One of the plan's actions, or a Typed promise, and when in the day. */
export const promiseChoice = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('action'), moment, actionId: z.uuid() }),
	z.object({
		kind: z.literal('typed'),
		moment,
		wording: z.string().trim().min(1).max(MAX_PROMISE_LENGTH)
	})
])
export type PromiseChoice = z.infer<typeof promiseChoice>

export const promiseChange = z.object({
	promiseId: z.uuid(),
	/** Made once by the screen, like a report's id. */
	changeId: z.uuid(),
	choice: promiseChoice
})

// ── Recall ────────────────────────────────────────────────────────────────

export const MAX_RECALL_ANSWER_LENGTH = 1000
export const MAX_RECALL_SCORE = 2

export const recallAnswer = z.discriminatedUnion('mode', [
	z.object({
		mode: z.literal('typed'),
		keyIdeaId: z.uuid(),
		answer: z.string().max(MAX_RECALL_ANSWER_LENGTH)
	}),
	z.object({ mode: z.literal('choice'), keyIdeaId: z.uuid(), choice: z.int().min(0).max(9) })
])
export type RecallAnswer = z.infer<typeof recallAnswer>

/**
 * A marked answer, or — when the AI can't mark it — the same question again as
 * multiple choice, with nothing saved. `moved_on`: it was no longer due.
 */
export const recallResult = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('graded'),
		score: z.int().min(0).max(MAX_RECALL_SCORE),
		reason: z.string(),
		modelAnswer: z.string(),
		isMultipleChoice: z.boolean()
	}),
	z.object({ kind: z.literal('choosing') }),
	z.object({ kind: z.literal('moved_on') })
])
export type RecallResult = z.infer<typeof recallResult>

export const lessonDone = z.object({ keyIdeaId: z.uuid() })

/** A write with nothing to return: the screen reads Today again. */
export const saved = z.object({ ok: z.literal(true) })

// ── What Today shows for each step ────────────────────────────────────────

const lesson = z.object({ keyIdeaId: z.string(), title: z.string(), lesson: z.string() })

const dueRecall = z.object({
	keyIdeaId: z.string(),
	title: z.string(),
	question: z.string(),
	/** The multiple choice fallback, shown only when the AI can't mark. */
	choices: z.array(z.string())
})

/** What the promise picker starts on: the current Promise, so keeping it is one tap. */
const promiseSelection = z.object({
	moment,
	actionId: z.string().nullable(),
	typed: z.string().nullable()
})

const promisePicker = z.object({
	/** Each Action at the Size its next Promise would be made at. */
	actions: z.array(z.object({ id: z.string(), wording: z.string() })),
	initial: promiseSelection.nullable()
})

export const PROMISE_NUDGES = ['differentAction', 'typeSmaller'] as const
export type PromiseNudgeKind = (typeof PROMISE_NUDGES)[number]

const reportWhen = z.enum(['today', 'yesterday'])

export const checkInView = z.discriminatedUnion('step', [
	z.object({ step: z.literal('report'), promiseId: z.string(), when: reportWhen }),
	z.object({
		step: z.literal('learn'),
		/** Today's recalls come first; the new idea shows once they're answered. */
		recall: dueRecall.nullable(),
		lesson: lesson.nullable()
	}),
	z.object({
		step: z.literal('commit'),
		picker: promisePicker,
		nudge: z.enum(PROMISE_NUDGES).nullable(),
		/** True once there is a Promise to keep, so the lead says "keep it or change it". */
		hasCurrent: z.boolean()
	}),
	z.object({
		step: z.literal('done'),
		/** Set while today's new Promise can still be changed. */
		change: promisePicker.extend({ promiseId: z.string() }).nullable(),
		/** The idea learned today, shown as a summary. */
		learned: lesson.nullable()
	})
])
export type CheckInView = z.infer<typeof checkInView>

/** A Report made today, which can be changed until 4am. */
export const changeableReport = z.object({
	promiseId: z.string(),
	promiseDay: keptDay,
	wording: z.string(),
	answer: z.enum(REPORT_ANSWERS),
	when: reportWhen
})
export type ChangeableReport = z.infer<typeof changeableReport>
