import 'server-only'
import type { GeneratedPlan } from '@/lib/learn/plan'
import { db } from '@/server/db/client'

// Saves a user's goal answers and plan in one transaction, so a plan never
// exists without its milestones, actions and key ideas. Safe to call twice:
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

		const { id: planId } = await tx.plan.create({
			data: {
				userId,
				goalId: savedGoal.id,
				model,
				confirmedAt: isConfirmed ? new Date() : null,
				milestones: {
					createMany: {
						data: plan.milestones.map((milestone, position) => ({ position, ...milestone }))
					}
				},
				actions: {
					createMany: { data: plan.actions.map((action, position) => ({ position, ...action })) }
				},
				keyIdeas: {
					createMany: { data: plan.keyIdeas.map((idea, position) => ({ position, ...idea })) }
				}
			},
			select: { id: true }
		})
		return { planId }
	})
}
