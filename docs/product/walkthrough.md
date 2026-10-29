# Kept walkthrough

What the app does, step by step, from the moment someone opens it. Updated Oct 30.

## The problem

People read a book like _Rich Habits_, feel motivated, and a week later nothing has changed. Two things go wrong:

- **They don't act.** Knowing "save 20%" is not doing it. Habit trackers let you tick a box, but nobody checks whether you did it.
- **They don't understand why it pays.** Many people never learned compound growth or what an emergency fund is. So the habits feel like rules, and rules get dropped.

Kept fixes both in 2 minutes a day. It checks whether you acted, and it teaches you the money skill behind each habit until you can answer a real question about your own money.

## Sara's first week

Sara is 26. She takes home £2,000 a month, spends about all of it and has £300 saved.

### Day 1: setup (about 5 minutes)

1. **Home page.** One line: "Build the habits that grow your money, 2 minutes a day." She clicks **Start**.
2. **Sign up** with email and password. She stays logged in for 30 days.
3. **Her dream.** She types: "I want to buy my own flat in 5 years."
4. **Her numbers.** Income £2,000, costs £2,000, savings £300. Then "Where does your money go?" She ticks her biggest spends and types rough amounts and how often: takeaways about £200 a month, 4 nights a week; coffee about £60 a month, most weekdays; 3 subscriptions she barely uses, about £10 each.
5. **Her plan.** Claude reads her dream and suggests a goal and daily actions. Code splits the goal into a year, a month and a day:
   - 5 year goal: £20,000 deposit
   - This year: save £4,000
   - This month: save £335, about £11 a day
   - Daily actions: cook instead of ordering, write down what you spent

   **Plan check.** Code adds up what her listed spends could free if she kept every promise it suggests: about £230 a month. It tells her plainly: "The spends you listed can free up about £230 a month. The other £105 has to come from somewhere else: other spending, more income, or a longer plan."

   She can change anything, then clicks **Confirm**. She keeps 5 years for now.

6. **First habit and money skill.**
   - Habit: "Save first, spend what's left" (Corley's save 20% habit).
   - Skill: compound growth, on her numbers. "If you save £335 a month for 5 years at 4%, you'll have about £22,200. You put in £20,100. The extra £2,100 is your money earning money." The 4% is an example rate, and the lesson says so.

7. **Her promise.** A promise is one action on one day. Most people don't know which action gets them to their plan, so the app shows them. It suggests promises ranked by how much each one moves her toward her £11 a day:

   | Promise for tomorrow                 | Saves about                     | Share of her £11 a day |
   | ------------------------------------ | ------------------------------- | ---------------------- |
   | Cook instead of ordering             | £9                              | 82%                    |
   | Make coffee at home                  | £2.50                           | 23%                    |
   | Cancel 2 subscriptions you don't use | £20 a month for good, 65p a day | 6%                     |

   Code works these out from her spending. Takeaways cost her about £200 a month over 17 nights, so about £11.50 an order. A simple meal at home costs about £2.50, so each night she cooks saves about £9.

   Under the table sits one promise that works differently: "On payday, move £335 to savings first." It doesn't save money on its own, it locks in the whole month, so it isn't added to the others.

   As she taps a promise, a bar shows how far it gets her: "Cooking tomorrow covers £9 of your £11 a day."

   She picks cooking, then picks when from her usual moments (wake up, lunch, after work, before bed): "After work, I will cook instead of ordering." If she's stuck, **Help me choose** lets Claude ask one or two questions ("What do you usually order, and when?") and suggest a promise. She can also type her own. A promise she types shows no £, because code can't price it.

8. **Her reminder.** She taps **Add daily reminder** once. Her phone's calendar now reminds her every evening at 8pm, "Open Kept and report back", with a link straight to today's screen. She can change the time, and she never has to add another.

### Day 2 (2 minutes)

1. **The reminder pops up.** She taps it and lands straight on today's screen, already logged in.
2. **Report.** "Did you cook instead of ordering today?" She taps **Yes**.
3. **Recall.** "If you save £335 a month for 5 years, about how much will you have, and why is it more than you put in?"
   - She types: "around 20k plus a bit of interest."
   - The app already knows the right answer, £22,200, because code worked it out from her numbers. Claude marks her **1 out of 2**: "Right idea. But the interest is about £2,100, not a bit. That's your money earning money."
   - If she thinks the mark is unfair, she taps **I think I was right** and says why. Her mark stays, and her answer joins the set we use to check the grader.
   - If Claude is down, she gets the same question as multiple choice.
4. **New habit and skill.**
   - Habit: "Live below your means."
   - Skill: emergency fund, on her numbers. "Your costs are about £67 a day. Your £300 lasts about 4 days if you lose your income. A safety net is usually 3 months of costs: £6,000."
5. **New promise.** Her current promise is pre-selected, so she keeps cooking for tomorrow with one tap. Her daily reminder already covers it.

### Days 3 to 5: the app adapts

- **Skills come back.** Each skill returns 1, 3 and 7 days after she learns it, so compound growth comes back on days 2, 4 and 8. A score of 0 out of 2 starts it over. A 1 out of 2 keeps it on schedule.
- **Two minutes stays two minutes.** A check-in asks at most 2 recall questions. When more are due, the skills she learned first go first and the rest wait a day. A new skill is taught only on a day with 1 recall or none, so on day 4 she gets 2 recalls and no new lesson.
- **Promises shrink when she struggles.** She says **No** to cooking on days 3 and 4. After the second No, the app makes the promise she commits for day 5 a size smaller: "After work, I will make eggs on toast instead of ordering."
- **Promises grow after a good run.** Three Yeses in a row and the promise moves up a size.
- **Partly holds steady.** A Partly keeps the promise the same size and doesn't count toward a run.
- **Her own promises shrink too.** After two Noes on a promise she typed herself, Kept asks her to type a smaller version.
- **A missed day doesn't count against her.** A promise she doesn't report by the end of the next day closes as Unreported, neither kept nor slipped. The app ignores it when sizing promises, so a weekend away doesn't shrink them.

### Day 5: the ledger

Corley was an accountant, so her progress looks like a ledger. It's one tap from today's screen, and on day 5 it shows:

- **Kept:** 2 promises (days 2 and 5). **Slipped:** 2 (days 3 and 4). A Partly would get its own line and count as half.
- **What it's worth:** "Each night you cook saves about £9. Cook on the 4 nights you usually order and that's about £1,900 a year, almost 10% of your deposit."
- **Weekly check:** "Promises kept this week are worth about £18. Your plan needs £77 a week. Cooking on all 4 nights would make it £36, and coffee at home on weekdays adds about £12.50."
- **What she learned:** compound growth, 1 out of 2 on day 2, 2 out of 2 on day 4.

Across all testers, this is our proof for the judges: each skill's score the first time it comes back against its score the last time, as raw numbers. A skill is taught one day and first tested the next, so there is no day 1 score.

## What the judges see

Our testers' week is the proof, so we make it easy to check.

- **Results page.** A public page with live numbers from all testers, built from the same events as the ledger: how many started, how many still check in each day, promises kept, partly kept and slipped, and recall scores the first time against the last time for each skill. Raw counts, people who dropped out included. No names or emails, and testers are told at sign-up that their numbers appear there.
- **Demo account.** A login with Sara's week already in it. Her taps are replayed through the same code a real user goes through, so judges see the shrink, the ledger and recall improving in 2 minutes instead of 5 days. We use it to test any day of the loop without waiting for one.
- **Grader check.** The 20 answers we graded by hand, plus every **I think I was right** from testers, with how often Claude's mark matched ours.

## Where the words come from

AI is used in three places only: suggesting the plan, marking answers, and the "Help me choose" button. Everything else is text we write, filled in with the user's numbers.

| Text in the app           | Where it comes from                                                                         | Example                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Report question           | Built from her own promise                                                                  | Promise "cook instead of ordering" becomes "Did you cook instead of ordering today?"               |
| Promise options           | Written by us. Each suggested promise comes in a small, medium and large size               | Small: "eggs on toast". Medium: "cook one simple meal". Large: "cook and keep leftovers for lunch" |
| Pounds each promise saves | Worked out by code from her spending and how often                                          | Cooking one night instead of ordering: about £9                                                    |
| "Help me choose"          | Claude asks one or two questions and suggests a promise. Code still works out the pounds    | "You order most on Fridays. Try cooking this Friday"                                               |
| Easier or harder promise  | Code moves her up or down a size                                                            | Two Noes in a row: down a size. Three Yeses in a row: up a size. A Partly: no change               |
| Lesson                    | Written by us, her numbers filled in                                                        | "Your costs are about £[67] a day..."                                                              |
| Recall question           | Written by us, her numbers filled in                                                        | "If you save £[335] a month for [5] years..."                                                      |
| Right answer              | Worked out by code                                                                          | £22,200                                                                                            |
| Her plan                  | Claude suggests the goal and daily actions. Code splits the goal into a year, month and day | Dream to £20,000, then £4,000 a year, £335 a month, £11 a day                                      |
| Plan check                | Worked out by code from her spending                                                        | "The spends you listed can free up about £230 a month"                                             |
| Marking her answer        | Claude compares her words to the right answer                                               | "1 out of 2. Interest is about £2,100, not a bit"                                                  |

Why so little AI:

- **Reliable.** Our questions never come out wrong, and code always gets the maths right.
- **Testable.** Because code knows the right answer, we can check whether Claude marks fairly. That is the grader check.
- **Faster to build.** Fewer calls to test and fewer ways to fail in front of testers.

## What's behind the screens

| What Sara sees                          | What does the work                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| Her plan                                | Goal planner: Claude suggests, code does the maths                              |
| Plan check                              | Code adds up what her listed spends could free                                  |
| Suggested promises and the progress bar | Promise coach: ranks promises by pounds saved toward her daily target           |
| "Is my answer right?"                   | Code works out the answer, Claude marks hers and says why                       |
| I think I was right                     | Saved with her answer, then added to the grader check                           |
| Easier or harder promises               | Adaptive engine, reading her Yes, Partly and No answers                         |
| Skills returning on days 2, 4 and 8     | Review scheduler (1, 3, 7 days, at most 2 recalls a check-in)                   |
| Phone reminder                          | One repeating calendar event, added once. No app install, no push notifications |
| The ledger                              | Every tap is saved as an event; the ledger is built from those events           |
| Results page                            | The same events, added up across all testers                                    |
| Demo account                            | Sara's week, replayed through the same code a real user goes through            |

The app teaches money ideas using the user's numbers. It is education, not financial advice.
