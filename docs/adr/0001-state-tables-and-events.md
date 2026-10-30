# State tables run the loop, events feed the ledger

The daily loop reads and writes ordinary `Promise` and `Report` tables, while the ledger and results page read only an append-only `Event` table. `recordEvent` writes in the same transaction as the change it records, and a test checks the two sources agree. We considered pure event sourcing, but folding events on every check-in makes the loop's queries harder for little benefit in a one-week build, and we kept the ledger on events because the walkthrough promises the judges that the ledger and results page are built from the same record of what happened.

## Consequences

Two records of the same taps exist on purpose, so a report change has to reach both, inside one transaction. Unreported is worked out from dates and has no event.
