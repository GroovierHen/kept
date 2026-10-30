import type { GeneratedPlan } from './plan'

// Sara's plan from docs/product/walkthrough.md: "I want to run 5k without
// stopping" in 8 weeks. The stubs return it until the planner lands, and the
// demo account (#35) saves it instead of asking Gemini.

export const SARA_GOAL = {
	text: 'I want to run 5k without stopping.',
	weeks: 8,
	startingPoint: 'I can jog about 1 km, then I have to walk.',
	obstacle: "I'm tired after work and skip it."
} as const

export const SARA_GENERATED_PLAN: GeneratedPlan = {
	milestones: [
		{ week: 2, text: 'Run 2 km without stopping' },
		{ week: 5, text: 'Run 3.5 km without stopping' },
		{ week: 8, text: 'Run 5 km without stopping' }
	],
	actions: [
		{
			small: 'walk and jog for 10 minutes',
			medium: 'run 20 minutes, walk breaks allowed',
			large: 'run 30 minutes, one walk break'
		},
		{
			small: 'put my running shoes by the door',
			medium: 'lay out my kit and plan a route',
			large: 'lay out my kit, plan a route and set an early alarm'
		},
		{
			small: 'do 2 minutes of calf stretches',
			medium: 'do 5 minutes of stretches',
			large: 'do 10 minutes of stretches and foam rolling'
		},
		{
			small: 'be in bed by 11:30',
			medium: 'be in bed by 11',
			large: 'be in bed by 10:30, phone away at 10'
		}
	],
	keyIdeas: [
		{
			title: 'Run slow enough to talk',
			lesson:
				'Most of your runs should feel easy. Easy runs build the base that lets you run further, and going hard every time is how beginners get injured and quit.',
			question: 'Why should most of your runs feel easy?',
			modelAnswer:
				'Easy runs build the base that lets you run further, and they keep you from getting injured, so you can keep going for the whole plan.',
			choices: [
				'They build your base and keep you from getting injured',
				'They burn the most calories',
				'Hard runs are only for experienced runners'
			],
			correctChoice: 0
		},
		{
			title: 'Add about 10% a week',
			lesson:
				'Grow your running time by about a tenth each week. Your heart and lungs adapt faster than your joints and tendons, so a big jump feels fine for a week and then hurts.',
			question: 'Why add only about 10% a week, even when you feel fine?',
			modelAnswer:
				'Your joints and tendons adapt slower than your heart and lungs, so bigger jumps lead to injury even when the run itself feels easy.',
			choices: [
				'Joints and tendons adapt slower than your heart and lungs',
				'Running more than that stops you losing weight',
				'It keeps your shoes from wearing out'
			],
			correctChoice: 0
		},
		{
			title: 'Rest days are when you get fitter',
			lesson:
				'A run tires your body out; the rest afterwards is when it rebuilds stronger. Skipping rest stacks tiredness until your runs get worse, not better.',
			question: 'What happens on a rest day, and why does it matter?',
			modelAnswer:
				'Your body repairs and rebuilds stronger after the run, so rest is when the fitness gain actually happens.',
			choices: [
				'Your body rebuilds stronger after the run',
				'You lose the fitness you built',
				'Nothing, it only saves time'
			],
			correctChoice: 0
		},
		{
			title: 'Tie the habit to something you already do',
			lesson:
				'"After work, I will run" works better than "I will run more". Linking a new habit to a moment you already have gives it a trigger, so you rely less on motivation.',
			question: 'Why does "after work, I will run" beat "I will run more"?',
			modelAnswer:
				'It ties the run to a moment that already happens every day, which acts as a trigger, so you rely less on motivation.',
			choices: [
				'An existing moment acts as a trigger',
				'Evenings are the best time to run',
				'Saying it out loud makes you commit'
			],
			correctChoice: 0
		},
		{
			title: "A missed day doesn't break a plan",
			lesson:
				'Missing one day changes almost nothing. Missing the next one too is what starts the slide, so the rule is simple: never miss twice.',
			question: 'What should you do the day after you miss a run, and why?',
			modelAnswer:
				'Do a run, even a small one, because one missed day barely matters but two in a row starts the habit sliding.',
			choices: [
				'Run, even a small one, so one miss never becomes two',
				'Run twice as far to make up for it',
				'Restart the plan from week one'
			],
			correctChoice: 0
		}
	]
}
