# PharmaStock — Reasoning

## Product Decision

The product was designed around the pharmacy inventory problem rather than treating medicines as simple stock counts.

A medicine can exist in several batches, and each batch can have a different expiry date. Therefore inventory must be represented at batch level.

## Data Model

The main entities are:

```text
User
Medicine
Batch
Dispense
OutboxEvent
Medicine → Batch

A medicine can contain multiple batches.

This allows the application to determine which batch should be dispensed first.

Batch

A batch stores:

batch number
quantity
expiry date
quarantine state

The quarantine state allows expired inventory to remain auditable while excluding it from sellable stock.

Dispense

Dispensing records are stored separately so that inventory operations can be audited.

OutboxEvent

The outbox provides a reliable integration boundary for notification events.

FEFO Decision

The application uses FEFO:

First Expiry, First Out

For every dispense, valid batches are considered in expiry-date order.

The system excludes:

expired batches
quarantined batches

before selecting inventory.

The dispense operation is performed transactionally so that batch updates and dispense records are committed together.

Sellable Stock

Sellable stock is calculated from valid inventory only.

Conceptually:

Sellable Stock =
sum(quantity of non-expired, non-quarantined batches)

This prevents expired inventory from appearing as usable stock.

Daily Clock

The /clock endpoint represents the daily automation job.

The endpoint was used because the challenge explicitly requires the daily automation to be testable through:

POST /clock

The job:

finds expired batches
quarantines them
finds batches expiring within seven days
returns counts
Messy Data Import

Real inventory imports can contain inconsistent data.

The import logic therefore normalizes:

"10 units" → 10
15/10/2026 → valid date
2026-10-15 → valid date

Rows that cannot be safely interpreted are rejected instead of silently creating incorrect inventory.

Duplicate rows are reported separately.

Reorder Notification

Each medicine has a configurable reorder threshold.

After dispensing, the system calculates remaining in-date stock.

If stock falls below the threshold, a notification event is written to the outbox.

The outbox allows a future Notification Service to consume these events without tightly coupling the inventory API to an external notification provider.

Pagination and Sorting

The medicine listing API supports server-side pagination and sorting.

This prevents the frontend from needing to load the complete medicine dataset before displaying results.

Authentication

JWT authentication protects inventory operations.

Passwords are hashed using bcrypt rather than stored directly.

Trade-offs

SQLite was selected because the challenge requires a real database while keeping the project easy to run inside a Codespace.

The Notification Service is represented through an outbox rather than an external provider because the core requirement is to demonstrate the integration boundary.

The frontend prioritizes the required inventory workflows over additional non-essential features.

Testing Strategy

The important workflows to verify are:

1. Register/login
2. Create medicine
3. Add multiple batches
4. Verify FEFO dispensing
5. Verify expired stock is excluded
6. Run /clock
7. Verify expired batches are quarantined
8. Import messy data
9. Verify imported/deduped/rejected counts
10. Configure reorder threshold
11. Dispense below threshold
12. Verify REORDER_ALERT in /outbox
13. Verify search
14. Verify pagination
15. Verify sorting