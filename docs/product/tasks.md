# Who does what

Kept has two halves. Abdelmalek owns **Learn**: what the app teaches and how it checks. Talha owns **Act**: what users do every day and how it's tracked. Each of us builds our features from screen to database, so each of us can demo our own work.

The spec is the [walkthrough](walkthrough.md). The [proposal](proposal.md) is the original pitch, and where the two differ, the walkthrough wins. The words are in [GLOSSARY.md](../../GLOSSARY.md) and the look is in [DESIGN.md](../../DESIGN.md).

## Abdelmalek: Learn

| Area             | What it includes                                                                                                                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Habit content    | The 10 habits and their money skills, in our own words, credited to Corley. Lesson text and recall question templates, with the user's numbers filled in                                                                                |
| Money maths      | Code that works out the right answers from the user's numbers: compound growth, emergency fund, inflation. Unit tested                                                                                                                  |
| Goal planner     | The plan step in setup. Code splits a goal into a year, a month, a week and a day (£20,000 in 5 years → £335 a month → £77 a week → £11 a day). Claude suggests the goal and daily actions from the dream. The user can edit all of it  |
| Learn card       | The card inside the Today screen and setup: the lesson, the recall questions, the mark, and the multiple choice fallback. A summary mode for the done-for-today screen                                                                  |
| Recall grader    | Claude marks the user's answer 0 to 2 against the right answer and says why. The **I think I was right** button, which saves the user's reason with the answer                                                                          |
| Grader check     | The 20 answers we graded by hand plus every **I think I was right** from testers, and how often Claude's mark matched ours                                                                                                              |
| Review scheduler | Brings each skill back 1, 3 and 7 days after it's learned. 0 out of 2 starts it over, 1 out of 2 stays on schedule. At most 2 recalls a check-in, the oldest skills first. A new skill only on a day with 1 recall or none. Unit tested |
| Recall progress  | Each skill's score the first time it comes back against its score the last time, per user and across all testers                                                                                                                        |

## Talha: Act

| Area                 | What it includes                                                                                                                                                                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Home page and login  | The home page line, email and password sign-up, 30 day sessions, logout, what a tester sees on a forgotten password. Supabase settings (Confirm email off, Site URL) and the live URL testers use                                                                              |
| Database and events  | The shared parts of the schema (`User` with time zone and reminder time), the events table, and one `recordEvent` helper both halves call                                                                                                                                      |
| Setup flow           | The order of the setup screens and moving between them. The dream, income, costs and savings screens, and "Where does your money go?" with amounts and how often. Learn's plan step and first learn card sit inside it                                                         |
| Today screen         | The check-in, one step at a time: report, the learn card, the next promise, then done for today. Day N, the Unreported note after a gap, and changing a report until 4am                                                                                                       |
| Promise coach        | The promise list: spending categories, promise wording, small, medium and large sizes, and the cost of the cheaper version. Prices per day, ranked by share of the daily target, the progress bar, the moment picker, "Type my own", and "Help me choose". Pricing unit tested |
| Plan check           | Adds up what the listed spends could free and shows the gap, inside Learn's plan step                                                                                                                                                                                          |
| Adaptive engine      | Two Noes in a row moves a promise down a size, three Yeses up a size. A Partly changes nothing and Unreported is ignored. Two Noes on a typed promise asks the user for a smaller one. Unit tested                                                                             |
| Daily reminder       | One repeating calendar event, added once at setup, that links straight to today's screen                                                                                                                                                                                       |
| Ledger               | Kept, Partly (worth half) and Slipped promises, built from the events table, the weekly check, what they're worth, and what she learned from Learn's recall progress                                                                                                           |
| Results page         | Live numbers across all testers from the events table, dropouts included, no names. The recall numbers come from Learn's recall progress                                                                                                                                       |
| Shared design pieces | The 4 shared components in [DESIGN.md](../../DESIGN.md), built first, so both of us build from them                                                                                                                                                                            |

Already done: the Kept day helper (`src/lib/kept-day.ts`), which turns a time into the user's Kept day and closes promises as Unreported.

## Where our halves meet

Before anyone builds, we spend an hour agreeing these and commit stubs that return fake data, so neither of us waits for the other:

1. **The schema, one file each.** Act owns `prisma/schema/act.prisma` and `base.prisma`. Learn owns `prisma/schema/learn.prisma`. Nobody edits the other's file, so our migrations never clash.
2. **The events.** One list of event names in `src/lib/analytics/events.ts`, agreed up front. Each of us saves our own taps through `recordEvent`.
3. **What Learn gives Act:**
   - `getPlan(userId)`: the goal and the year, month, week and day targets
   - `getTodaysLesson(userId, keptDay)`: today's habit and lesson, or nothing on a day with 2 recalls
   - `getDueReviews(userId, keptDay)`: which skills come back today, at most 2, the oldest first
   - `gradeRecall(userId, questionId, answer)`: the score, the reason and the right answer
   - `getRecallProgress(userId?)`: first and last scores per skill, for one user or all testers
   - `<LearnCard>` (step and summary modes) and `<PlanStep>`
4. **What Act gives Learn:**
   - `keptDay` as a plain `YYYY-MM-DD`, from the Kept day helper, so Learn never reads the clock
   - `getUserNumbers(userId)`: income, costs and savings, for the lessons and the plan
   - `<PlanCheck>`, which Learn places in the plan step
   - The 4 shared design pieces
5. **AI calls.** Each of us calls Claude only through `src/server/ai/anthropic.ts`. The models we use are registered once, in the first PR, so we never both edit `src/server/lib/ai-usage/models.ts`.
6. **The design.** Agreed in [DESIGN.md](../../DESIGN.md). Nobody types a colour or font by hand.

## When

Each piece is due the day testers first need it. Testers sign up on Sat Oct 31, so Day 2 is Sun Nov 1 and Day 5 is Wed Nov 4. Their first reminder goes off at 8pm on Sunday. All times are PKT.

Feedback 1 is on Fri Oct 30 at 5:30pm, the day before testers sign up, so the Day 1 work is due then instead of Saturday. Saturday morning is for fixes from the feedback.

| Due                                       | Testers need it for                         | Abdelmalek                                                                                                              | Talha                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Fri Oct 30, 5:30pm, Feedback 1            | Day 1: setup, shown working on the live URL | First 5 habits and skills, money maths, plan step with a typed goal and the code split, learn card for the first lesson | Shared design pieces (first thing), home page and login, database and events, setup flow, promise coach (without "Help me choose"), daily reminder, live URL |
| Sat Oct 31, before testers sign up        | Day 1, for real testers                     | Fixes from Feedback 1                                                                                                   | Fixes from Feedback 1                                                                                                                                        |
| Sun Nov 1, 6pm, before the first reminder | Day 2: the first check-in                   | Recall grader with the multiple choice fallback, review scheduler, the recall part of the learn card                    | Today screen: report, learn, the next promise, done for today                                                                                                |
| Mon Nov 2                                 | Day 3: the earliest two Noes in a row       | Claude's goal suggestion, I think I was right, recall progress                                                          | Adaptive engine, plan check, "Help me choose"                                                                                                                |
| Tue Nov 3, last day for new features      | Day 5: the ledger                           | Grader check, last 5 habits                                                                                             | Ledger and weekly check, what it's worth, results page                                                                                                       |
| Wed Nov 4, before the final demo          | The judges                                  | Demo account: supplies Sara's recall answers                                                                            | Demo account: builds the replay                                                                                                                              |

Why things sit where they do:

- **Day 1 needs only setup.** A tester signs up, makes a plan, learns the first skill and commits a promise for tomorrow. Nothing is reported on Day 1, so the Today screen and the grader can land on Sunday.
- **The plan is needed on Day 1, Claude's part isn't.** Promise prices need a daily target from the first promise. The user types a goal and years, and code splits it. Claude's suggestion is added on top on Monday.
- **The events table is needed on Day 1.** The results page and the proof need every tap from the first one, and taps that weren't saved can't be recovered later.
- **The review scheduler is due Sunday.** Day 2's recall question needs it.
- **The adaptive engine is due Monday.** Day 2 is the first report, so Day 3 is the earliest a tester can have two Noes in a row.
- **The last 5 habits come last.** A new skill is taught only on a day with 1 recall or none, so in their first week testers reach about 5 skills.
- **Nothing waits on something due later.** Setup and the Today screen use Learn's stubs until the real plan step and card land. The ledger and results page read recall progress, which lands a day earlier. The demo account comes last because it replays everything else.

If time runs short, what it's worth goes first. The daily loop never goes.

## Both of us

- Collect design references (see [DESIGN.md](../../DESIGN.md))
- Recruit testers, tell them at sign-up that their numbers appear on the results page without names, and look after them
- Interview 3 testers and ship one change from what they say
- Daily updates in our own words, Looms, the final demo
- Commit `.claude-logs/` with every change
