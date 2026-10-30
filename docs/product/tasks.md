# Who does what

Kept has two halves. Abdelmalek owns **Plan and Learn**: turning a goal into a plan with Gemini, and teaching and checking the plan's key ideas. Talha owns **Act**: what users do every day and how it's tracked. Each of us builds our features from screen to database, so each of us can demo our own work.

The spec is the [walkthrough](walkthrough.md). On Oct 30 we agreed Kept works for any goal, not only money, and the walkthrough was rewritten that day. The [proposal](proposal.md) is the original money-only pitch, and where the two differ, the walkthrough wins. The words are in [GLOSSARY.md](../../GLOSSARY.md) and the look is in [DESIGN.md](../../DESIGN.md).

## Abdelmalek: Plan and Learn

| Area             | What it includes                                                                                                                                                                                                                                                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Goal screens     | The goal, the 4, 8 or 12 weeks, and the two questions: "Where are you now?" and "What usually gets in your way?" Each saves when it's answered                                                                                                                                                                                                                         |
| Goal planner     | One Gemini call (`gemini-3.5-flash-lite`, free tier) through `src/server/ai/google.ts` that returns the plan as JSON, checked with Zod: 2 to 4 milestones, 3 to 5 actions with all three sizes, 5 key ideas each with a lesson, question, model answer and 3 options. One retry on a bad shape. Turns down goals that could hurt someone. Tested on 10 different goals |
| Plan step        | The screen that shows the plan, lets the user reword or remove an action, **Try again** once, and **Confirm**. Locked after Confirm. When Gemini is down, a clear message, and the plan is built on the next visit                                                                                                                                                     |
| Learn card       | The card inside setup and the Today screen: the lesson, the recall question, the mark, and the multiple choice fallback. A summary mode for the done-for-today screen                                                                                                                                                                                                  |
| Recall grader    | Gemini marks the user's answer 0 to 2 against the model answer and says why. A right multiple choice answer scores 1, is marked as multiple choice, and is left out of the grader check. The **I think I was right** button, which saves the user's reason with the answer                                                                                             |
| Review scheduler | Brings each key idea back 1, 3 and 7 days after it's learned. 0 out of 2 starts it over, 1 day after that recall, and 1 out of 2 stays on schedule. Each return counts from the day of the actual recall, and nothing returns after the 7 day one. At most 2 recalls a check-in, the oldest ideas first. A new idea only on a day with 1 recall or none. Unit tested   |
| Milestone check  | On the day a milestone is due, one Yes or Not yet question in the check-in, saved as an event                                                                                                                                                                                                                                                                          |
| Recall progress  | Each key idea's score the first time it comes back against its score the last time, per user and across all testers. Only ideas with two or more recalls are compared, with the number left out shown                                                                                                                                                                  |
| Grader check     | 20 answers we graded by hand, plus every **I think I was right** from testers, and how often Gemini's mark matched ours                                                                                                                                                                                                                                                |
| Plan check       | We read every tester's plan the day it's made, and count how many passed first time, needed a retry, or we would have changed                                                                                                                                                                                                                                          |

## Talha: Act

| Area                 | What it includes                                                                                                                                                                                                                                                                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home page and login  | Done: the home page, email and password sign-up, 30 day sessions, logout. Still to do: change the money copy to any goal, the "Forgot it? Message us" line, the message for an email already taken, and saving the browser's time zone once at sign-up                                                                                                   |
| Database and events  | `act.prisma`: `User` (moved from `example.prisma`, with time zone, reminder time, counts in results, is demo), `Promise`, `Report` (added to, never edited) and `Event`. One `recordEvent` helper both halves call, writing in the same transaction as the change it records                                                                             |
| Setup flow           | The order of the setup screens, saved step by step, returning to the first unfinished one. Learn's goal screens, plan step and first learn card sit inside it, then the promise and the reminder                                                                                                                                                         |
| Promise picker       | The plan's actions in Gemini's order, each at its current size, the first one selected. The moment picker, "Type my own", and pre-selecting the current promise on the Today screen                                                                                                                                                                      |
| Today screen         | The check-in, one step at a time: report, the learn card, the milestone question when one is due, the next promise, then done for today. Day N, the Unreported note after a gap, changing a report or a committed promise until 4am, and starting at commit after an unfinished check-in                                                                 |
| Adaptive engine      | Two Noes in a row moves a promise down a size, three Yeses up a size, within small to large. At small, two more Noes offer a different action. A Partly ends a run and Unreported is skipped. A run restarts after a size change. Size and runs are worked out from reports, not stored. Two Noes on a typed promise asks for a smaller one. Unit tested |
| Daily reminder       | One repeating calendar event, added once at setup with a chosen time, as an `.ics` file or a Google Calendar link, that links straight to today's screen                                                                                                                                                                                                 |
| Ledger               | Kept, Partly (worth half) and Slipped promises built from the events table, which actions grew or shrank, this week, the next milestone, and what she learned from Learn's recall progress                                                                                                                                                               |
| Results page         | Live numbers across all testers from the events table: signed up, started, still checking in, promises kept, partly kept and slipped, milestones reached, dropouts included, no names or goals. Accounts not counted in results are left out in one shared query. The recall numbers come from Learn's recall progress                                   |
| Demo account         | Sara's week replayed through the same code, passing the Kept day rather than faking a clock. Learn supplies her saved plan and her recall answers                                                                                                                                                                                                        |
| Shared design pieces | Done: the 4 shared components in [DESIGN.md](../../DESIGN.md). `Money` stays for goals that mention pounds, but no screen needs it now                                                                                                                                                                                                                   |

Already done: the Kept day helper (`src/lib/kept-day.ts`), which turns a time into the user's Kept day and closes promises as Unreported.

Dropped on Oct 30, because they only worked for money: spends, promise prices, the money plan check, money maths, what it's worth, one-off actions, usual frequency, payday advice and Help me choose.

## Where our halves meet

Before anyone builds, we spend an hour agreeing these and commit stubs that return fake data, so neither of us waits for the other:

1. **The schema, one file each.** Act owns `prisma/schema/act.prisma` and `base.prisma`. Learn owns `prisma/schema/learn.prisma`: `Goal`, `Plan`, `Milestone`, `PlanAction` (with its three sizes), `KeyIdea`, `Review` and `RecallAttempt`. `Promise.planActionId` points at `PlanAction`, and since Prisma needs the relation in both files, we write those two lines together in that hour. After that, nobody edits the other's file, so our migrations never clash.
2. **The events.** One typed list of Kept's event names next to `recordEvent`, separate from the PostHog list in `src/lib/analytics/events.ts`: signed up, setup finished, plan generated, plan confirmed, reminder added, promise committed, report made, lesson taught, recall graded, I think I was right pressed, and milestone checked. Each of us saves our own through `recordEvent`, with ids and enums and no free text.
3. **What Learn gives Act:**
   - `getPlanStatus(userId)`: no goal, goal saved, plan made or confirmed, so setup knows which step is unfinished
   - `getPlan(userId)`: the goal, weeks, milestones and actions with their three sizes, in Gemini's order
   - `getTodaysLesson(userId, keptDay)`: today's key idea and lesson, or nothing on a day with 2 recalls
   - `getDueReviews(userId, keptDay)`: which key ideas come back today, at most 2, the oldest first
   - `getDueMilestone(userId, keptDay)`: the milestone to ask about today, or nothing
   - `gradeRecall(userId, keyIdeaId, answer)`: the score, the reason and the model answer
   - `getRecallProgress(userId?)`: first and last scores per key idea, for one user or all testers
   - `<GoalSteps>`, `<PlanStep>` and `<LearnCard>` (step and summary modes)
4. **What Act gives Learn:**
   - `keptDay` as a plain `YYYY-MM-DD`, from the Kept day helper, so Learn never reads the clock
   - `recordEvent`
   - The 4 shared design pieces
5. **AI calls.** We use Gemini's free tier, not Claude, to keep the cost at zero. Learn makes both calls, the planner and the grader, only through a new `src/server/ai/google.ts`, with `gemini-3.5-flash-lite` for both. If the planner's 10 goal test fails on it, the planner moves to `gemini-3.8-flash`, which is also free. The provider and model are registered once, in Learn's first PR. Nothing in the daily loop calls an AI except marking a recall answer.
6. **The design.** Agreed in [DESIGN.md](../../DESIGN.md). Nobody types a colour or font by hand.

## When

Each piece is due the day testers first need it. Testers sign up on the evening of Sat Oct 31, so Day 2 is Sun Nov 1 and Day 5 is Wed Nov 4. Their first reminder goes off at 8pm on Sunday. All times are PKT.

| Due                                       | Testers need it for                      | Abdelmalek                                                                                           | Talha                                                                                  |
| ----------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Fri Oct 30, tonight                       | Nothing yet: both halves can build       | `learn.prisma`, stubs, the model registered, the planner working from a script on 10 goals           | `act.prisma`, `recordEvent`, the setup flow with Learn's stubs, the money copy changed |
| Sat Oct 31, 6pm, before testers sign up   | Day 1: setup                             | Goal screens, the planner in the app, plan step, the first learn card                                | Promise picker, daily reminder, live URL, Day 1 browser test                           |
| Sun Nov 1, 6pm, before the first reminder | Day 2: the first check-in                | Recall grader with the multiple choice fallback, review scheduler, the recall part of the learn card | Today screen: report, learn, the next promise, done for today                          |
| Mon Nov 2, Feedback 2                     | Day 3: the earliest three Yeses in a row | I think I was right, recall progress, the first plan check                                           | Adaptive engine, gaps and corrections                                                  |
| Tue Nov 3, last day for new features      | Day 5: the ledger                        | Grader check, milestone check                                                                        | Ledger, results page                                                                   |
| Wed Nov 4, before the final demo          | The judges                               | Demo account: Sara's saved plan and recall answers. Interview testers                                | Demo account: the replay. Interview testers                                            |

Why things sit where they do:

- **Day 1 needs the planner.** Without a plan there is no action to promise, so the planner and plan step are the first thing testers touch, and the riskiest. Tonight it only has to work from a script; tomorrow it goes in the app.
- **The events table is needed on Day 1.** The results page and the proof need every event from the first one, and events that weren't saved can't be recovered later.
- **The review scheduler is due Sunday.** Day 2's recall question needs it.
- **The adaptive engine is due Monday.** Day 2 is the first report, so Day 4 is the earliest a tester can have three Yeses in a row, and Day 3 two Noes.
- **The milestone check comes late.** The first milestone is due at week 2, after the test ends for most testers, so the demo account shows it.
- **Nothing waits on something due later.** Setup and the Today screen use Learn's stubs until the real plan step and card land. The ledger and results page read recall progress, which lands a day earlier. The demo account comes last because it replays everything else.

If time runs short, the milestone check goes first, then the plan check. The daily loop never goes.

## Both of us

- Collect design references (see [DESIGN.md](../../DESIGN.md))
- Recruit testers with a mix of goals, tell them at sign-up that their numbers appear on the results page without names and that their goal and answers are sent to Google's Gemini, and look after them
- Interview 3 testers and ship one change from what they say
- Daily updates in our own words, Looms, the final demo
- Record and transcribe every pair call, and post the transcript in the team chat
- Commit `.claude-logs/` with every change
