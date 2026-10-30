# Kept

Kept is a daily goal coach: Gemini turns a user's goal into a Plan of small Actions and Key ideas, and each day the user reports on a small promise, recalls a Key idea, and commits the next promise.

## Language

### The goal and plan

**Goal**:
What the user wants, in their own words, with how long they give themselves (4, 8 or 12 weeks), such as "I want to run 5k without stopping" in 8 weeks.
_Avoid_: dream, wish, target

**Plan**:
What Gemini makes from the Goal at setup, in a fixed shape code checks: Milestones, Actions in three Sizes, and Key ideas. The user can edit it until they confirm it, and not after.
_Avoid_: roadmap, track, program

**Milestone**:
A checkpoint in the Plan with a week number, such as "week 2: run 2 km without stopping". The user answers Yes or Not yet once, on the day it's due.
_Avoid_: step, stage, sub-goal

**Key idea**:
One idea behind the Goal that the user learns and recalls, such as "run slow enough to talk". Each has a lesson, a recall question, a Model answer and three multiple choice options, all written by Gemini at setup.
_Avoid_: skill, tip, lesson (the lesson is the text that teaches a Key idea)

**Model answer**:
The answer saved with a Key idea that Gemini marks the user's answer against.
_Avoid_: right answer, solution

### The daily loop

**Kept day**:
One day in the user's own time zone, running from 4am to 4am, so a check-in after midnight still belongs to the evening before.
_Avoid_: calendar day, date (when the 4am boundary matters)

**Action**:
A repeatable thing the user can do toward their Goal, such as "Run". It comes from the user's Plan, written in a small, medium and large Size, or is typed by the user.
_Avoid_: habit, daily action, promise (a promise is one Action on one day)

**Promise**:
One Action committed to on one specific Kept day, at the Size and wording fixed when it was made, such as "After work, I will walk and jog for 10 minutes." A user has at most one a day.
_Avoid_: goal, task, commitment

**Typed promise**:
A Promise the user wrote themselves. It counts as Kept, Partly or Slipped, but has no other Size, so three Yeses change nothing and two Noes ask the user to type a smaller one.
_Avoid_: custom promise, own promise

**Size**:
How much effort an Action asks for: small, medium or large. Every Action starts at small.
_Avoid_: level, difficulty, tier

**Run**:
An unbroken series of the same Report on one Action. A Partly or a change of size ends it, an Unreported is skipped over, and switching Action starts a new one.
_Avoid_: streak

**Check-in**:
One Kept day's turn of the loop: the user reports on their due promise, learns, and commits the next promise, across as many visits as that takes. Setup counts as Day 1's check-in.
_Avoid_: session, visit, daily loop (the loop is the repeating cycle, a check-in is one turn of it)

**Today screen**:
The screen where the user does their check-in, one step at a time, ending in a done-for-today summary once the day's check-in is complete.
_Avoid_: daily screen, home, dashboard

**Report**:
The user's Yes, Partly or No answer to whether they kept a promise.
_Avoid_: report back (as a noun), answer, response

**Unreported**:
A promise nobody reported on by the end of the Kept day after its own; it counts as neither kept nor slipped.
_Avoid_: missed, skipped, slipped (slipped means the user said No)

**Day N**:
The Nth Kept day since the user signed up, where Day 1 is the sign-up day.
_Avoid_: check-in number, streak day

**Week**:
The last 7 Kept days.
_Avoid_: calendar week

### Learning

**Recall**:
One recall question on a Key idea, answered in the user's own words and marked 0, 1 or 2 out of 2 by Gemini against the Model answer. If Gemini is down, it is asked as multiple choice instead, and marked as such.
_Avoid_: quiz, test, review (a review is the date a Key idea is due back)

**Review**:
The Kept day a Key idea is due back for Recall: 1, 3 and 7 days after it's learned, at most 2 in a check-in.
_Avoid_: repetition, reminder

### Proof

**Event**:
A saved record of a moment that changes the user's progress, such as a promise committed or a report made. The ledger and results page are built from events.
_Avoid_: tap, analytics event (those go to PostHog and prove nothing)

**Demo account**:
A login holding Sara's week, with a saved Plan, replayed through the same code as a real user, and left out of the results page.
_Avoid_: test user, sample data

**Tester**:
A real person trying Kept whose numbers count on the results page. The Demo account and the team's own accounts are not testers.
_Avoid_: user (when the results page's counts are meant)

**Started**:
A tester who finished setup, as distinct from one who only signed up.
_Avoid_: joined, active

**Still checking in**:
A tester who submitted a Report on that Day N.
_Avoid_: retained, active
