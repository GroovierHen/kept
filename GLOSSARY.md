# Kept

Kept is a money-habit coach: each day a user reports on a small promise, learns a money skill on their own numbers, and commits the next promise.

## Language

### The daily loop

**Kept day**:
One day in the user's own time zone, running from 4am to 4am, so a check-in after midnight still belongs to the evening before.
_Avoid_: calendar day, date (when the 4am boundary matters)

**Action**:
A repeatable thing the user can do to save money, such as cooking instead of ordering. It has a size, and each one comes from our list or is typed by the user.
_Avoid_: habit, daily action, promise (a promise is one Action on one day)

**Promise**:
One Action committed to on one specific Kept day, at the size and saving fixed when it was made, such as "After work, I will cook instead of ordering." A user has at most one a day.
_Avoid_: goal, task, commitment

**Typed promise**:
A Promise the user wrote themselves. It counts as Kept, Partly or Slipped but has no saving, so it adds no £.
_Avoid_: custom promise, own promise

**One-off Action**:
An Action that is finished once it is kept, such as cancelling subscriptions, and saves a monthly amount for good.
_Avoid_: permanent promise, recurring saving

**Size**:
How much effort an Action asks for: small, medium or large. Size changes the effort, and only a One-off Action's saving changes with it.
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

### Money

**Spend**:
One category of regular spending the user lists at setup, with how much it costs and how often it happens.
_Avoid_: expense, cost (costs are the user's total monthly outgoings)

**Cheaper version**:
What the Action's replacement costs each time, such as a meal at home instead of a takeaway. An Action's saving is one occasion of its Spend minus this.
_Avoid_: alternative, substitute

**Daily target**:
The plan's monthly goal expressed per day, using the one conversion Kept uses for all money per day: × 12 ÷ 365.
_Avoid_: daily goal, daily budget

**Usual frequency**:
How many times a week the user's Spend happens. An Action's value in a Week stops here, however many of its promises are kept.
_Avoid_: limit, cap

**Week**:
The last 7 Kept days.
_Avoid_: calendar week

**Payday advice**:
The line telling the user to move their monthly goal to savings on payday. It is advice, not a Promise: it can't be selected or reported, and it isn't in the ledger.
_Avoid_: payday promise

### Proof

**Event**:
A saved record of a moment that changes the user's progress, such as a promise committed or a report made. The ledger and results page are built from events.
_Avoid_: tap, analytics event (those go to PostHog and prove nothing)

**Demo account**:
A login holding Sara's week, replayed through the same code as a real user, and left out of the results page.
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
