// Plain values shared by the goal screens and the server's checks, kept free
// of Zod so the form doesn't pull it into the browser. Defined once for the
// web and the app.
export {
	GOAL_QUESTIONS,
	MAX_GOAL_ANSWER_LENGTH,
	PLAN_WEEKS,
	type GoalQuestion
} from '@kept/contract/limits'
