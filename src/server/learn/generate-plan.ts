import 'server-only'
import { generateContent } from '@/server/ai/google'
import type { TrackedModel } from '@/server/lib/ai-usage/models'
import { planGoal, type PlannerGoal, type PlanResult } from './planner'

// Light and on Gemini's free tier. If plans from it fall short, the planner
// moves to gemini-3.8-flash (also free); registering it in OPENROUTER_SLUGS
// comes first, so it doesn't compile until that's done.
export const PLANNER_MODEL: TrackedModel = 'gemini-3.5-flash-lite'

// Low enough that two users with the same goal get similar plans, high enough
// that the wording isn't robotic.
const TEMPERATURE = 0.4

/** One Gemini call (two if the first answer has the wrong shape), tracked and costed. */
export function generatePlan({
	userId,
	goal
}: {
	userId: string
	goal: PlannerGoal
}): Promise<PlanResult> {
	return planGoal({
		goal,
		ask: async ({ prompt, responseJsonSchema, attempt }) => {
			const response = await generateContent(
				{
					feature: attempt === 1 ? 'goal_plan' : 'goal_plan_retry',
					model: PLANNER_MODEL,
					meta: { user_id: userId }
				},
				{
					contents: prompt,
					config: {
						responseMimeType: 'application/json',
						responseJsonSchema,
						temperature: TEMPERATURE
					}
				}
			)
			return response.text
		}
	})
}
