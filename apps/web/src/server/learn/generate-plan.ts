import 'server-only'
import { chatCompletion } from '@/server/ai/openrouter'
import type { TrackedModel } from '@/server/lib/ai-usage/models'
import { FLAGGED, planGoal, type PlannerGoal, type PlanResult, type PreviousPlan } from './planner'

// Chosen by benchmark, with reasoning off (docs/adr/0003). It takes no
// temperature, so a Try again differs because it is shown the first plan.
export const PLANNER_MODEL: TrackedModel = 'openai/gpt-6-luna'

/**
 * One AI call (two if the first answer has the wrong shape), tracked and
 * costed. `previous` is the plan the person has, for the one Try again.
 */
export function generatePlan({
	userId,
	goal,
	previous
}: {
	userId: string
	goal: PlannerGoal
	previous?: PreviousPlan
}): Promise<PlanResult> {
	return planGoal({
		goal,
		previous,
		ask: async ({ prompt, responseJsonSchema, attempt }) => {
			const reply = await chatCompletion(
				{
					feature: `${previous == null ? 'goal_plan' : 'goal_replan'}${attempt === 1 ? '' : '_retry'}`,
					model: PLANNER_MODEL,
					meta: { user_id: userId }
				},
				{
					messages: [{ role: 'user', content: prompt }],
					jsonSchema: { name: 'plan_reply', schema: responseJsonSchema }
				}
			)
			return reply.kind === 'flagged' ? FLAGGED : { text: reply.text }
		}
	})
}
