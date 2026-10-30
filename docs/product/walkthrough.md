# Kept walkthrough

What the app does, step by step, from the moment someone opens it. Updated Oct 30: Kept now works for any goal, not only money.

## The problem

People decide they want something, "get fit", "learn guitar", "save for a holiday", feel motivated for a few days, and a week later nothing has changed. Three things go wrong:

- **They don't know the steps.** "Get fit" is a wish, not a plan. Nobody tells them what to do today.
- **They don't act.** Knowing what to do is not doing it. Habit trackers let you tick a box, but nobody checks whether you did it, and nothing changes when you struggle.
- **They don't understand why it works.** Without the ideas behind the habit, the habit feels like a rule, and rules get dropped.

Kept fixes all three in 2 minutes a day. Gemini turns the user's goal into a plan of small daily actions and the key ideas behind them. Every day, Kept checks whether they acted, makes tomorrow's promise smaller or bigger based on what they said, and asks them to recall an idea until it sticks.

## Sara's first week

Sara is 26. She wants to get fit, can jog about 1 km before she has to walk, and is tired after work.

### Day 1: setup (about 5 minutes)

1. **Home page.** One line: "Pick a goal. Kept turns it into one small promise a day, and checks on you." She clicks **Start**.
2. **Sign up** with email and password. She stays logged in for 30 days.
3. **Her goal.** She types: "I want to run 5k without stopping." She picks how long she gives herself: 4, 8 or 12 weeks. She picks 8.
4. **Two questions.** Gemini needs to know where she starts:
   - "Where are you now?" She types: "I can jog about 1 km, then I have to walk."
   - "What usually gets in your way?" She types: "I'm tired after work and skip it."

   Each step saves as she finishes it, so if she leaves, she comes back to the first unfinished step.

5. **Her plan.** Gemini builds it in about 10 seconds:
   - **Goal:** run 5 km without stopping in 8 weeks
   - **Milestones:** week 2, run 2 km without stopping. Week 5, 3.5 km. Week 8, 5 km.
   - **Daily actions,** each in a small, medium and large size:

   | Action                     | Small                            | Medium                              | Large                                               |
   | -------------------------- | -------------------------------- | ----------------------------------- | --------------------------------------------------- |
   | Run                        | walk and jog for 10 minutes      | run 20 minutes, walk breaks allowed | run 30 minutes, one walk break                      |
   | Get ready the night before | put my running shoes by the door | lay out my kit and plan a route     | lay out my kit, plan a route and set an early alarm |
   | Stretch                    | do 2 minutes of calf stretches   | do 5 minutes of stretches           | do 10 minutes of stretches and foam rolling         |
   | Sleep                      | be in bed by 11:30               | be in bed by 11                     | be in bed by 10:30, phone away at 10                |
   - **Key ideas,** 5 of them, which she learns one at a time over the week: run slow enough to talk; add about 10% a week, not more; rest days are when you get fitter; tie the habit to something you already do; a missed day doesn't break a plan.

   She can reword or remove any action, and press **Try again** once for a new plan. Then she clicks **Confirm**. After **Confirm**, the plan can't be edited during the test; if something is wrong, she messages us.

   Behind the screen, Gemini returns the plan in a fixed shape and code checks it: 2 to 4 milestones, 3 to 5 actions with all three sizes, 5 key ideas each with a question, a model answer and 3 multiple choice options. A plan that doesn't pass is asked for again once. If Gemini fails, the plan step tries once more, then shows "We couldn't build your plan right now. Your answers are saved, try again in a minute" with a **Try again** button, and we're alerted. She stays on the plan step until it works, so nobody reaches today's screen without a confirmed plan.

   Gemini turns down goals that could hurt someone, such as "lose 10 kg in 2 weeks", and suggests a safer version instead.

6. **First key idea.** "Run slow enough to talk. Most of your runs should feel easy. Easy runs build the base that lets you run further, and going hard every time is how beginners get injured and quit."

7. **Her promise for tomorrow.** A promise is one action on one day, and she makes at most one a day. Her plan's actions are listed in Gemini's order, the first one selected, and every action starts at small:

   "After work, I will walk and jog for 10 minutes."

   She picks when from her usual moments (wake up, lunch, after work, before bed). She can pick a different action, or tap **Type my own** and write one. A typed promise counts like any other, but Kept has no smaller or bigger version of it.

8. **Her reminder.** She picks a time, 8pm by default, and taps **Add daily reminder** once, as a calendar file or a Google Calendar link. Her phone now reminds her every evening, "Open Kept and report back", with a link straight to today's screen. She changes the time later in her calendar, and she never has to add another. If the link opens logged out, she signs in and lands on today's screen.

### Day 2 (2 minutes)

1. **The reminder pops up.** She taps it and lands straight on today's screen, already logged in.
2. **Report.** "Did you walk and jog for 10 minutes today?" She taps **Yes**.
3. **Recall.** "Why should most of your runs feel easy?"
   - She types: "so you don't get too tired."
   - Gemini compares her words with the model answer saved in her plan and marks her **1 out of 2**: "Partly. Easy runs also build the base that lets you run further, and they keep you from getting injured."
   - If she thinks the mark is unfair, she taps **I think I was right** and says why. Her mark stays, and her answer joins the set we use to check the grader.
   - If Gemini is down, she gets the same question as multiple choice.
4. **New key idea:** "Add about 10% a week, not more."
5. **New promise.** Her current promise is pre-selected, so she keeps going with one tap. Her daily reminder already covers it.

### Days 3 to 5: the app adapts

- **Ideas come back.** Each key idea returns 1, 3 and 7 days after she learns it, so "run slow enough to talk" comes back on days 2, 4 and 8. A score of 0 out of 2 starts it over, 1 day after that recall. A 1 out of 2 keeps it on schedule. If an idea waits a day, its next return counts from the day she actually answered. After the 7 day return, it doesn't come back in this build.
- **Two minutes stays two minutes.** A check-in asks at most 2 recall questions. When more are due, the ideas she learned first go first and the rest wait a day. A new idea is taught only on a day with 1 recall or none.
- **Promises grow after a good run.** She says **Yes** on days 2, 3 and 4. After the third Yes, the promise she commits for day 5 moves up a size: "After work, I will run 20 minutes, walk breaks allowed."
- **Promises shrink when she struggles.** Two Noes in a row and the next promise moves down a size.
- **Sizes have limits.** At small, two more Noes keep it small and offer a different action from her plan. At large, it stays large. A run starts again after any change of size, and switching to a different action starts a new run. Going back to an action picks up its size.
- **Partly holds steady.** A Partly keeps the promise the same size and ends a run, so No, Partly, No doesn't shrink it.
- **Her own promises shrink too.** After two Noes on a promise she typed herself, Kept asks her to type a smaller version. Three Yeses change nothing, because Kept has no bigger version to offer.
- **A missed day doesn't count against her.** A promise she doesn't report by the end of the next day closes as Unreported, neither kept nor slipped. The app skips it when sizing promises, so a weekend away doesn't shrink them, and No, Unreported, No still counts as two Noes.
- **Milestones get checked.** On the day a milestone is due, today's screen asks once: "Can you run 2 km without stopping yet?" **Yes** or **Not yet**. Not yet changes nothing in her plan; it is shown honestly in her ledger.

### Day 5: the ledger

Her progress looks like a ledger. It's one tap from today's screen, and on day 5 it shows:

- **Kept:** 3 promises (days 2, 3 and 4). **Partly:** 1 (day 5, she ran 15 minutes). **Slipped:** 0. A Partly counts as half. A promise she typed counts here too.
- **Getting bigger:** "Run" moved from small to medium on day 5.
- **This week:** 3.5 of 4 promises kept. Day 1 had no promise to report, because setup makes the first one for day 2.
- **Next milestone:** run 2 km without stopping, due in 9 days.
- **What she learned:** run slow enough to talk, 1 out of 2 on day 2, 2 out of 2 on day 4.

A week is her last 7 Kept days.

Across all testers, this is our proof for the judges: each key idea's score the first time it comes back against its score the last time, as raw numbers, and how many promises were kept, partly kept and slipped. An idea is taught one day and first tested the next, so there is no day 1 score. Only ideas with two or more recalls are compared, and the page shows how many were left out. Starting an idea over doesn't change which score was first.

## The same app, other goals

Nothing in the loop knows about running. Gemini writes the plan, and code runs the loop the same way for any goal.

| Goal                                | An action, small to large                                           | A key idea                                      |
| ----------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------- |
| "Save £2,000 for a holiday by July" | skip one takeaway, skip two this week, move £50 to savings today    | Pay yourself first, on payday                   |
| "Lose 5 kg before March"            | swap one snack for fruit, add protein to lunch, cook dinner at home | Protein keeps you full for longer               |
| "Play 3 songs on guitar"            | practise one chord change for 5 minutes, 15 minutes, 30 minutes     | Short daily practice beats one long session     |
| "Read the Quran with tajweed"       | read 3 lines aloud, half a page, a full page with the rules marked  | Learn one rule at a time and hear it, then read |

## What the judges see

Our testers' week is the proof, so we make it easy to check.

- **Results page.** A public page with live numbers from all testers, built from the same events as the ledger: how many signed up, how many started (finished setup), how many still check in each day (submitted a report that day), promises kept, partly kept and slipped, milestones reached, and recall scores the first time against the last time for each key idea. Raw counts, people who dropped out included. No names, emails or goals, and testers are told at sign-up that their numbers appear there. They are also told that their goal and answers are sent to Google's Gemini, whose free tier may use them to improve its products, so they shouldn't type anything private. The demo account and our own accounts aren't counted.
- **Demo account.** A login with Sara's week already in it. Her plan is saved, not generated, and her taps are replayed through the same code a real user goes through, so judges see the promise grow, the ledger and recall improving in 2 minutes instead of 5 days. We use it to test any day of the loop without waiting for one.
- **Grader check.** 20 answers we graded by hand, plus every **I think I was right** from testers, with how often Gemini's mark matched ours.
- **Plan check.** We read every tester's plan the day it's made, and count how many passed code's checks first time, needed a second try, or we would have changed.
- **Forgotten passwords.** Reset emails can't reach testers, so a wrong password shows "Forgot it? Message us" and we reset it by hand. A taken email at sign-up shows "That email already has an account" with a link to sign in.

## Where the words come from

AI is used in two places only: making the plan, and marking answers. Gemini makes the plan once, at setup. After that, the daily loop runs on code.

| Text in the app          | Where it comes from                                                    | Example                                                       |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| Her plan                 | Gemini, in a fixed shape that code checks, then she edits and confirms | Goal, 3 milestones, 4 actions in 3 sizes, 5 key ideas         |
| Promise wording          | Her plan's action at its current size, with her moment                 | "After work, I will walk and jog for 10 minutes."             |
| Report question          | Built from her own promise                                             | "Did you walk and jog for 10 minutes today?"                  |
| Easier or harder promise | Code moves her up or down a size within her plan's action              | Three Yeses in a row: small to medium                         |
| Lesson                   | Her plan's key idea, written by Gemini at setup                        | "Run slow enough to talk..."                                  |
| Recall question          | Her plan's key idea, written by Gemini at setup                        | "Why should most of your runs feel easy?"                     |
| Model answer             | Her plan's key idea, written by Gemini at setup, checked by us         | "Easy runs build your base and keep you from getting injured" |
| Marking her answer       | Gemini compares her words to the model answer                          | "1 out of 2. Easy runs also build your base..."               |
| Multiple choice fallback | Her plan's key idea, written by Gemini at setup                        | 3 options, one right                                          |
| Ledger, results page     | Code, from the events table                                            | "3.5 of 4 promises kept"                                      |

Why so little AI:

- **Reliable.** One call at setup that code checks, instead of new text every day that nobody checks.
- **Testable.** Every recall question has a saved model answer, so we can check whether Gemini marks fairly. That is the grader check.
- **Free and fast.** We use a light Gemini model on Google's free tier. The 2 minute check-in never waits on Gemini, except to mark an answer.

## What's behind the screens

| What Sara sees                  | What does the work                                                              |
| ------------------------------- | ------------------------------------------------------------------------------- |
| Her plan                        | Goal planner: Gemini writes it, code checks its shape                           |
| Her promise and its size        | Promise picker: her plan's actions, each at its current size                    |
| "Is my answer right?"           | Recall grader: Gemini marks her words against the saved model answer            |
| I think I was right             | Saved with her answer, then added to the grader check                           |
| Easier or harder promises       | Adaptive engine, reading her Yes, Partly and No answers                         |
| Ideas returning on days 2, 4, 8 | Review scheduler (1, 3, 7 days, at most 2 recalls a check-in)                   |
| Milestone question              | Milestone check, on the day each milestone is due                               |
| Phone reminder                  | One repeating calendar event, added once. No app install, no push notifications |
| The ledger                      | Each meaningful tap is saved as an event; the ledger is built from those events |
| Results page                    | The same events, added up across all testers                                    |
| Demo account                    | Sara's week, replayed through the same code a real user goes through            |

Kept helps people build habits toward their own goals. It is not medical, financial or professional advice.
