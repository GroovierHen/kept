import 'server-only'
import type { GeneratedPlan } from '@/lib/learn/plan'
import { toKeptDay } from '@/lib/kept-day'
import { db } from '@/server/db/client'
import { recordEvent } from '@/server/events/record-event'

// Saves a user's goal answers and plan in one transaction, so a plan never
// exists without its milestones, actions and key ideas, or without its
// plan_generated Event (ADR 0001). Safe to call twice:
// a user has one plan (unique userId), and a second call returns the first.
// The planner (#30) and the demo account (#35) both save through here.
export async function savePlan({
	userId,
	goal,
	plan,
	model,
	isConfirmed = false
}: {
	userId: string
	goal: { text: string; weeks: number; startingPoint: string; obstacle: string }
	plan: GeneratedPlan
	model: string
	isConfirmed?: boolean
}): Promise<{ planId: string }> {
	try {
		return await createPlan({ userId, goal, plan, model, isConfirmed })
	} catch (error) {
		// Two saves at once: the unique userId let one through. Hand back that one.
		if (!isUniqueViolation(error)) throw error
		const existing = await db.plan.findUnique({ where: { userId }, select: { id: true } })
		if (existing == null) throw error
		return { planId: existing.id }
	}
}

function isUniqueViolation(error: unknown): boolean {
	return typeof error === 'object' && error != null && 'code' in error && error.code === 'P2002'
}

async function createPlan({
	userId,
	goal,
	plan,
	model,
	isConfirmed
}: {
	userId: string
	goal: { text: string; weeks: number; startingPoint: string; obstacle: string }
	plan: GeneratedPlan
	model: string
	isConfirmed: boolean
}): Promise<{ planId: string }> {
	return db.$transaction(async (tx) => {
		const savedGoal = await tx.goal.upsert({
			where: { userId },
			create: { userId, ...goal },
			update: {},
			select: { id: true, plan: { select: { id: true } } }
		})
		if (savedGoal.plan != null) return { planId: savedGoal.plan.id }

		const rows = planRows(plan)
		const created = await tx.plan.create({
			data: {
				userId,
				goalId: savedGoal.id,
				model,
				confirmedAt: isConfirmed ? new Date() : null,
				milestones: { createMany: { data: rows.milestones } },
				actions: { createMany: { data: rows.actions } },
				keyIdeas: { createMany: { data: rows.keyIdeas } }
			},
			select: { id: true, user: { select: { timeZone: true } } }
		})
		const keptDay = toKeptDay({ instant: new Date(), timeZone: created.user.timeZone })
		await recordEvent({
			tx,
			event: {
				userId,
				name: 'plan_generated',
				keptDay,
				details: { build: 1 },
				idempotencyKey: 'plan_generated:1'
			}
		})
		if (isConfirmed) {
			await recordEvent({
				tx,
				event: {
					userId,
					name: 'plan_confirmed',
					keptDay,
					details: {},
					idempotencyKey: 'plan_confirmed'
				}
			})
		}
		return { planId: created.id }
	})
}

/** A plan's children as rows, numbered in Gemini's order. */
export function planRows(plan: GeneratedPlan) {
	return {
		milestones: plan.milestones.map((milestone, position) => ({ position, ...milestone })),
		actions: plan.actions.map((action, position) => ({ position, ...action })),
		keyIdeas: plan.keyIdeas.map((idea, position) => ({ position, ...idea }))
	}
}
