# Who does what

Kept has two halves. Abdelmalek owns **Learn**: what the app teaches and how it checks. Talha owns **Act**: what users do every day and how it's tracked. Each of us builds our features from screen to database, so each of us can demo our own work.

The full idea is in the [proposal](proposal.md) and the [walkthrough](walkthrough.md). The look is in [DESIGN.md](../../DESIGN.md).

## Abdelmalek: Learn

| Area             | What it includes                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Habit content    | The 10 habits and their money skills, in our own words, credited to Corley. Lesson text, recall question templates, small, medium and large promise options per habit |
| Money maths      | Code that works out the right answers from the user's numbers: compound growth, emergency fund, inflation. Unit tested                                                |
| Recall grader    | Claude marks the user's answer 0 to 2 and says why. Multiple choice fallback if Claude fails. Test against 20 answers we graded by hand                               |
| Review scheduler | Brings each skill back 1, 3 and 7 days after it's learned. A wrong answer starts it over                                                                              |
| Goal planner     | Claude turns a dream and the user's numbers into a yearly, monthly and daily plan the user can edit                                                                   |
| Recall progress  | Day 1 vs day 5 recall scores, per user and across all testers                                                                                                         |

## Talha: Act

| Area                 | What it includes                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Login and database   | Email and password, 30 day sessions, logout, the database tables, daily backup, tunnel for testers                  |
| Daily loop screens   | The daily screen: report back, the space for the learn and recall card, commit                                      |
| Promise coach        | "Where does your money go?" step, promises ranked by pounds saved, the progress bar, weekly check, "Help me choose" |
| Adaptive engine      | Moves the promise down a size after misses and up after a good run                                                  |
| Calendar reminders   | Turns each promise into a calendar file with a reminder                                                             |
| Ledger               | Kept and slipped promises, built from the events table, plus projections                                            |
| Shared design pieces | Builds the 4 shared components in [DESIGN.md](../../DESIGN.md) first, so both of us build from them                 |

## When

| Tier   | Abdelmalek                                            | Talha                                                                          | Due        |
| ------ | ----------------------------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| Must   | First 5 habits and skills, money maths, recall grader | Login, database, shared design pieces, daily loop screens, promise suggestions | Fri Oct 30 |
| Should | Goal planner, review scheduler, last 5 habits         | Adaptive engine, calendar reminders, weekly check, "Help me choose"            | Mon Nov 2  |
| Nice   | Recall progress chart                                 | Ledger projections                                                             | Tue Nov 3  |

Testers start Sat Oct 31, so the must tier has to work end to end by Friday night.

## Where our halves meet

We agree these together before splitting up:

1. **The database tables.** Both halves read and write them.
2. **Three functions Abdelmalek writes and Talha's screens call:**
   - `getTodaysLesson(userId)`: the habit, lesson and promise options for today
   - `gradeRecall(userId, questionId, answer)`: the score, the reason and the right answer
   - `getDueReviews(userId, date)`: which skills come back today
3. **The daily screen.** Talha builds the screen. Abdelmalek builds the learn and recall card that sits inside it.
4. **The design.** Agreed in [DESIGN.md](../../DESIGN.md). Nobody types a colour or font by hand.

## Both of us

- Collect design references (see [DESIGN.md](../../DESIGN.md))
- Recruit testers and look after them
- Daily updates in our own words, Looms, the final demo
- Commit `.claude-logs/` with every change
