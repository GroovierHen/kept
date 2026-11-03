import type { RecallScore } from './review-schedule'

// Sara's recall answers for the demo week (#35), the Learn half of the replay
// (#25). Her plan is SARA_GENERATED_PLAN; these are what she types when its
// ideas come back, with the marks the walkthrough gives them. The marks are
// fixed rather than asked of the AI, so the judges see the same week every
// time and the replay costs nothing.
//
// Which ideas come back on which day isn't chosen here: it is what the review
// scheduler asks, given one idea taught a day and at most 2 recalls a day.
// sara-week.test.mts replays the scheduler and fails if these drift from it.
//
//   Day 1: learns idea 0
//   Day 2: recalls idea 0 (1/2), learns idea 1
//   Day 3: recalls idea 1, learns idea 2
//   Day 4: recalls ideas 0 (2/2) and 2, so no new idea that day
//   Day 5: recalls idea 1, learns idea 3

export interface SaraRecall {
	/** Sara's day, 1 being sign-up. */
	readonly day: number
	/** The key idea's position in her plan. */
	readonly idea: number
	readonly answer: string
	readonly score: RecallScore
	readonly reason: string
}

export const SARA_RECALLS: readonly SaraRecall[] = [
	{
		day: 2,
		idea: 0,
		answer: "so you don't get too tired",
		score: 1,
		reason:
			'Partly. Easy runs also build the base that lets you run further, and they keep you from getting injured.'
	},
	{
		day: 3,
		idea: 1,
		answer: 'because your joints and tendons need longer to catch up than your lungs',
		score: 2,
		reason: 'Yes. Your heart and lungs adapt faster than your joints and tendons.'
	},
	{
		day: 4,
		idea: 0,
		answer: 'easy runs build my base so I can go further, and they stop me getting injured',
		score: 2,
		reason: 'Yes, both parts: they build your base and keep you from getting injured.'
	},
	{
		day: 4,
		idea: 2,
		answer: 'you recover',
		score: 1,
		reason: 'Partly. Rest is when your body rebuilds stronger, so it is when you get fitter.'
	},
	{
		day: 5,
		idea: 1,
		answer: 'big jumps feel fine at first but your tendons can get hurt',
		score: 2,
		reason: 'Yes. Tendons adapt slower, so a big jump hurts a week later.'
	}
]
