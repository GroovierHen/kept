# Kept walkthrough

What the app does, step by step, from the moment someone opens it. Updated Oct 29 after the review.

## The problem

People read a book like _Rich Habits_, feel motivated, and a week later nothing has changed. Two things go wrong:

- **They don't act.** Knowing "save 20%" is not doing it. Habit trackers let you tick a box, but nobody checks whether you did it.
- **They don't understand why it pays.** Many people never learned compound growth or what an emergency fund is. So the habits feel like rules, and rules get dropped.

Kept fixes both in 2 minutes a day. It checks whether you acted, and it teaches you the money skill behind each habit until you can answer a real question about your own money.

## Sara's first week

Sara is 26. She takes home £2,000 a month, spends £1,600 and has £300 saved.

### Day 1: setup (about 5 minutes)

1. **Home page.** One line: "Build the habits that grow your money, 2 minutes a day." She clicks **Start**.
2. **Sign up** with email and password. She stays logged in for 30 days.
3. **Her dream.** She types: "I want to buy my own flat in 5 years."
4. **Her numbers.** Income £2,000, costs £1,600, savings £300. Then "Where does your money go?" She ticks her biggest spends and types rough amounts: takeaways about £200 a month, coffee about £60, 3 subscriptions she barely uses.
5. **Her plan.** Claude turns the dream into a plan:
   - 5 year goal: £20,000 deposit
   - This year: save £4,000
   - This month: save £335
   - Daily habits: cook instead of ordering, write down what you spent

   She can change anything, then clicks **Confirm**.

6. **First habit and money skill.**
   - Habit: "Save first, spend what's left" (Corley's save 20% habit).
   - Skill: compound growth, on her numbers. "If you save £335 a month for 5 years at 4%, you'll have about £22,200. You put in £20,100. The extra £2,100 is your money earning money."
7. **Her promise.** Most people don't know which action gets them to their plan, so the app shows them. It suggests promises ranked by how much each one moves her toward her £335 a month:

   | Promise                                   | Saves about       | Share of her £335 |
   | ----------------------------------------- | ----------------- | ----------------- |
   | Cook instead of ordering, 4 nights a week | £156 a month      | 47%               |
   | Make coffee at home, 3 days a week        | £39 a month       | 12%               |
   | Cancel 2 subscriptions you don't use      | £20 a month       | 6%                |
   | On payday, move £335 to savings first     | Locks in the goal | 100%              |

   A bar shows how far her promises get her: "Your promises cover £215 of your £335 a month."

   She picks cooking, then picks when from her usual moments (wake up, lunch, after work, before bed): "After work, I will cook instead of ordering." If she's stuck, **Help me choose** lets Claude ask one or two questions ("What do you usually order, and when?") and suggest a promise.

   She clicks **Add to calendar**, and her phone reminds her at 8pm tomorrow: "Open Kept and report back."

### Day 2 (2 minutes)

1. **The reminder pops up.** She taps it and lands straight on today's screen, already logged in.
2. **Report back.** "Did you cook instead of ordering today?" She taps **Yes**.
3. **Recall.** "You save £335 a month for 5 years. About how much will you have, and why is it more than you put in?"
   - She types: "around 20k plus a bit of interest."
   - The app already knows the right answer, £22,200, because code worked it out from her numbers. Claude marks her **1 out of 2**: "Right idea. But the interest is about £2,100, not a bit. That's your money earning money."
   - If Claude is down, she gets the same question as multiple choice.
4. **New habit and skill.**
   - Habit: "Live below your means."
   - Skill: emergency fund, on her numbers. "Your costs are about £53 a day. Your £300 lasts 6 days if you lose your income. A safety net is usually 3 months of costs: £4,800."
5. **New promise** for tomorrow, added to her calendar.

### Days 3 to 5: the app adapts

- **Skills come back.** Compound growth returns on days 2, 4 and 8. If she gets it wrong, it starts over.
- **Promises shrink when she struggles.** She says **No** to cooking on days 3 and 4. On day 5 the app makes it easier: "After work, I will make eggs on toast instead of ordering."
- **Promises grow after a good run.** Several Yeses in a row and the action gets bigger.

### Day 5: the ledger

Corley was an accountant, so her progress looks like a ledger:

- **Kept:** 4 promises. **Slipped:** 2.
- **What it's worth:** "Cooking 4 nights a week saves about £1,900 a year. That's 10% of your deposit."
- **Weekly check:** "Promises kept this week are worth about £38. Your plan needs £77 a week. Coffee at home 3 days would close most of the gap."
- **What she learned:** compound growth, 1 out of 2 on day 2, 2 out of 2 on day 5.

Across all testers, this is our proof for the judges: recall scores on day 1 against day 5, as raw numbers.

## Where the words come from

AI is used in three places only: making the plan, marking answers, and the "Help me choose" button. Everything else is text we write, filled in with the user's numbers.

| Text in the app           | Where it comes from                                                                            | Example                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Report question           | Built from her own promise                                                                     | Promise "cook instead of ordering" becomes "Did you cook instead of ordering today?"               |
| Promise options           | Written by us. Each habit has a small, medium and large action. She picks one or types her own | Small: "eggs on toast". Medium: "cook one simple meal". Large: "cook and keep leftovers for lunch" |
| Pounds each promise saves | Worked out by code from her spending                                                           | Cooking 4 nights: about £156 a month                                                               |
| "Help me choose"          | Claude asks one or two questions and suggests a promise. Code still works out the pounds       | "You order most on Fridays. Try cooking on Fridays only"                                           |
| Easier or harder promise  | Code moves her up or down that ladder                                                          | Two Noes in a row: medium to small                                                                 |
| Lesson                    | Written by us, her numbers filled in                                                           | "Your costs are about £[53] a day..."                                                              |
| Recall question           | Written by us, her numbers filled in                                                           | "You save £[335] a month for [5] years..."                                                         |
| Right answer              | Worked out by code                                                                             | £22,200                                                                                            |
| Her plan                  | Claude, then she edits it                                                                      | Dream to £20,000, £4,000 a year, £335 a month                                                      |
| Marking her answer        | Claude compares her words to the right answer                                                  | "1 out of 2. Interest is about £2,100, not a bit"                                                  |

Why so little AI:

- **Reliable.** Our questions never come out wrong, and code always gets the maths right.
- **Testable.** Because code knows the right answer, we can check whether Claude marks fairly. That is the 20 hand graded answers test.
- **Faster to build.** The must tier is due Friday.

The promise suggestions, pound values and progress bar are plain code and sit in the must tier. "Help me choose" sits in the should tier, along with Claude suggesting a smaller version when a user keeps missing a promise they typed themselves.

## What's behind the screens

| What Sara sees                          | What does the work                                                    |
| --------------------------------------- | --------------------------------------------------------------------- |
| Her plan                                | Goal planner (Claude)                                                 |
| Suggested promises and the progress bar | Promise coach: ranks promises by pounds saved toward her monthly goal |
| "Is my answer right?"                   | Code works out the answer, Claude marks hers and says why             |
| Easier or harder promises               | Adaptive engine, reading her Yes, Partly and No answers               |
| Skills returning on days 2, 4 and 8     | Review scheduler (1, 3, 7 days)                                       |
| Phone reminders                         | Calendar files. No app install, no push notifications                 |
| The ledger                              | Every tap is saved as an event; the ledger is built from those events |

The app teaches money ideas using the user's numbers. It is education, not financial advice.
