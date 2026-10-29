# Rich Habits app proposal

Oct 28, 2026 · Abdelmalek

We build a web app that turns the Rich Habits method into a daily 2 minute routine that adapts to each person, and we prove it works with real testers.

## The problem

Most people already know what they should do with their money and time: save more, spend less on small things, read, plan. They don't do it, and a week after reading a book like Rich Habits they have changed nothing.

Apps don't fix this. Habit trackers let you tick a box but never teach you anything. Book apps teach you but never check if you acted. The closest app, Atoms by James Clear, is criticised for passive lessons.

I used Rich Habits in my own life and saw real results, so I know the method works when you actually run it. Our app runs it for people.

## What the user does

On day 1 the user turns a dream into a plan. After that, a 2 minute routine every day.

**Day 1: dream to daily plan.** The user types "I want to own my home in 5 years". The app breaks it down the Rich Habits way: a yearly goal (save £8,000), a monthly goal (£670) and daily habits (cook instead of ordering, read 30 minutes about money). The user edits and confirms.

**Every day after that:**

1. **Report back.** "Did you cook dinner yesterday?" Yes, Partly or No.
2. **Recall.** Explain one habit in your own words. The app checks the answer.
3. **Commit.** "After I [existing routine], I will [tiny action]", for example "After work, I will cook pasta". One click adds it to the user's calendar as a reminder.

| Day | What happens                                                  |
| --- | ------------------------------------------------------------- |
| 1   | Dream becomes a plan. First habit learned. First promise made |
| 2   | Report back on the promise. Next habit                        |
| 3   | Report back. Day 1 habit comes back as a recall question      |
| 5   | Missed reading twice, so the action shrinks to "read 5 pages" |
| 7   | Weekly ledger: habits kept vs slipped, recall day 1 vs day 7  |

The app shows progress as a ledger, because Corley is an accountant. Kept habits are credits, slips are debits. A projection turns them into real numbers, for example cooking 4 nights a week saves about £1,900 a year.

## What we build under the hood

The screens are simple on purpose. The work is in six engines behind them.

| Engine                 | What it does in plain words                                                                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Goal planner           | Claude turns a dream into a goal tree (year, month, day). The user can edit every part                                                                       |
| Recall grader          | Claude scores the user's answer 0 to 2 and says why. If Claude fails, the app falls back to multiple choice. We test it against 20 answers we graded by hand |
| Adaptive habit engine  | Makes tomorrow's action easier after misses and harder after a good run                                                                                      |
| Review scheduler       | Brings each habit back at the right time, sooner if forgotten. We reuse FSRS, the open source scheduler Anki uses                                            |
| Ledger and projections | Every action is saved as an event. The ledger, the money projections and the day 1 vs day 7 progress are built from those events                             |
| Calendar reminders     | Turns each promise into a calendar file, so the user's phone reminds them. No push notifications needed                                                      |

Stack proposal: a web app (for example Next.js) with SQLite, running on localhost. Everything is saved as events from day 1, so we can show real tester numbers.

## Accounts and data

We need a database and a simple login, and we skip everything else that usually comes with accounts.

**Database.** Everything depends on remembering yesterday: the promise, the report back, review dates, the ledger. We use SQLite: one file on the laptop, no server to set up.

**Login and logout.** All testers use the same app on our laptop, so the app must know whose promises are whose.

| Do                                                 | Skip                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| Email and password                                 | Google or Apple sign in                                           |
| Stay logged in for 30 days                         | Email verification                                                |
| Logout button                                      | "Forgot password" emails. We reset by hand for a tester if needed |
| A ready made auth library (Better Auth or Auth.js) | Writing our own password handling                                 |

Staying logged in matters most. When a tester taps the "report back" reminder on their phone, the app must open on yesterday's promise, not a login screen.

**What the database holds:**

| Table           | What's in it                                                          |
| --------------- | --------------------------------------------------------------------- |
| users           | Created by the auth library                                           |
| habits          | The 10 habits: lesson, recall question, key idea, tiny action options |
| plans           | Each user's dream, yearly goal, monthly goal, daily habits            |
| commitments     | "After work, I will cook pasta", for which day                        |
| reports         | Yes, Partly or No for each commitment, plus an optional note          |
| recall_attempts | The answer, Claude's score and reason, any disagreement               |
| reviews         | When each habit is next due for each user (the scheduler's data)      |
| events          | Every action with a time, for the ledger and tester numbers           |

**Other pieces:**

- The Claude API key stays on the server, never in the browser.
- No background jobs. When a user opens the app, we work out what's due today.
- A tunnel (such as ngrok) so testers can open the app on their phones. We ask 8x first whether that's allowed.
- A daily copy of the SQLite file, so a bug can't wipe tester data before the final demo.

## Who owns what

We decide the split together. Each of us should own whole features, front to back, so each of us can demo our own work.

| Area                          | Includes                                                          | Owner |
| ----------------------------- | ----------------------------------------------------------------- | ----- |
| Goal planner                  | Dream to plan screen, Claude prompt, editing the tree             |       |
| Habit content                 | 10 habits in our own words, recall questions, tiny action options |       |
| Recall grader                 | Claude grading, fallback, hand graded test set                    |       |
| Daily loop screens            | Report back, learn, commit                                        |       |
| Adaptive engine and scheduler | Easier or harder actions, FSRS review timing                      |       |
| Ledger and calendar           | Ledger, projections, progress view, calendar files                |       |
| Accounts and database         | Login, logout, database tables, tunnel for testers, daily backup  |       |
| Shared                        | Data model and design style, testers, daily updates, Looms        | Both  |

## Skills we learn

| Skill                                                    | Where we use it             |
| -------------------------------------------------------- | --------------------------- |
| Building with Claude: prompts with a fixed output format | Goal planner, recall grader |
| Testing AI output (is the grader right?)                 | Grader test set             |
| Handling failure (API down, bad output)                  | Grader fallback             |
| Product logic and state rules, with unit tests           | Adaptive engine             |
| Using an existing algorithm (FSRS)                       | Review scheduler            |
| Data modelling with an event log                         | Whole app                   |
| Charts and data design                                   | Ledger, progress view       |
| Integrations (calendar files)                            | Calendar reminders          |
| UI design that doesn't look like AI                      | Whole app                   |
| Writing for users (lessons, questions)                   | Habit content               |
| User testing and showing honest numbers                  | Testers, proof of results   |

## Day by day plan

Testers must start by Oct 29 or 30 to reach day 7 before the final demo, so recruiting comes first.

| Date       | What we build                                                       | Goal for the day                                             |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------------------------ |
| Wed Oct 28 | Repo, data model, design style. First 5 habits written. Tester list | Idea posted, repo and logs ready                             |
| Thu Oct 29 | Report back, learn and commit screens. Simple recall                | Feedback 1: daily loop works end to end. First testers start |
| Fri Oct 30 | Recall grader with Claude and fallback. Calendar reminders          | Testers report back for the first time                       |
| Sat Oct 31 | Grader test on 20 answers. Adaptive engine                          |                                                              |
| Sun Nov 1  | Goal planner. Review scheduler (FSRS)                               | Day 3 tester numbers                                         |
| Mon Nov 2  | Remaining 5 habits. Ledger v1                                       | Feedback 2: grader, planner, day 3 numbers                   |
| Tue Nov 3  | Planner polish. Projections and progress view                       | Stop adding features                                         |
| Wed Nov 4  | Interview 3 testers. Ship one change from their feedback            | Day 7 tester numbers                                         |
| Thu Nov 5  | Design pass and fixes                                               | Feedback 3: final demo                                       |
| Fri Nov 6  | Final Looms and updates                                             | Last day                                                     |

## What we cut, and questions for you

We skip a chatbot, bank linking, social features, leagues and more than 10 habits. Judges reward a few things that work deeply. If time runs short, the projections go first. The daily loop never goes.

Two honesty rules: we write habits in our own words and credit Tom Corley, and we never promise people they will get rich. Corley's study was never peer reviewed, so we show our own tester numbers instead.

Questions for you:

- [ ] Which areas do you want to own?
- [ ] Money track or Open track?
- [ ] Next.js and SQLite okay, or do you prefer another stack?
- [ ] Who can you bring as testers? We need 8 to 15 by Oct 30
- [ ] When can we do our first recorded call today?
