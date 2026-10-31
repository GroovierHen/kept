import 'server-only'
import { generateContent } from '@/server/ai/google'
import type { TrackedModel } from '@/server/lib/ai-usage/models'
import { planGoal, type PlannerGoal, type PlanResult } from './planner'

// Light and on Gemini's free tier. If plans from it fall short, the planner
// moves to gemini-3.8-flash (also free); registering it in OPENROUTER_SLUGS
// comes first, so it doesn't compile until that's done.
export const PLANNER_MODEL: TrackedModel = 'gemini-3.5-flash-lite'

// The first plan: low enough that two users with the same goal get similar
// plans, high enough that the wording isn't robotic. Try again runs hotter,
// since a person asking for a new plan wants a different one.
const TEMPERATURE = { 1: 0.4, 2: 0.9 } as const

/**
 * One Gemini call (two if the first answer has the wrong shape), tracked and
 * costed. build is 1 for the first plan and 2 for the one Try again.
 */
export function generatePlan({
	userId,
	goal,
	build = 1
}: {
	userId: string
	goal: PlannerGoal
	build?: 1 | 2
}): Promise<PlanResult> {
	return planGoal({
		goal,
		ask: async ({ prompt, responseJsonSchema, attempt }) => {
			const response = await generateContent(
				{
					feature: `${build === 1 ? 'goal_plan' : 'goal_replan'}${attempt === 1 ? '' : '_retry'}`,
					model: PLANNER_MODEL,
					meta: { user_id: userId }
				},
				{
					contents: prompt,
					config: {
						responseMimeType: 'application/json',
						responseJsonSchema,
						temperature: TEMPERATURE[build]
					}
				}
			)
			return response.text
		}
	})
}
