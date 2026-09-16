# ADR-005: Use a transactional outbox and idempotent background jobs

**Status:** Accepted

**Date:** 2026-09-16

**Decision owners:** StagePaid maintainers

## Context

StagePaid must perform work that cannot safely or efficiently finish inside an
HTTP request or database transaction. Examples include sending client review
links, delivering payment notifications, generating receipts and exports,
processing uploaded evidence, and reconciling external provider events.

A business transition and its external side effect cannot share one atomic
transaction. If the application commits an approval and then crashes before
publishing the invoice job, the invoice work may be lost. If it publishes first
and the database transaction later rolls back, a worker may act on business
state that never committed. This is the dual-write problem.

Queues and providers normally deliver messages at least once. Requests,
webhooks, workers, and network responses can be retried after an operation has
already succeeded. StagePaid therefore cannot depend on exactly-once delivery
or assume that receiving a message once means its effect occurred once.

## Decision

StagePaid will use a **PostgreSQL transactional outbox as the durable source of
asynchronous job intent** and **idempotent background workers** to perform side
effects after the originating business transaction commits.

Business changes and their outbox entries will be written in the same database
transaction. A worker or dispatcher will claim committed entries, execute or
publish their jobs, and record outcomes. Delivery is at least once; effective
business processing must be once or otherwise explicitly safe to repeat.

A managed queue may be introduced for wake-up, buffering, concurrency, and
delivery efficiency. It does not replace the PostgreSQL outbox as proof that
required work was durably requested unless a later ADR establishes an equally
reliable atomic publication design.

## Decision details

### Outbox record

An outbox entry contains enough information to identify, route, and monitor the
work without embedding unrestricted domain state. At minimum it records:

- a unique job identifier;
- a stable job type and payload version;
- the owning module and related aggregate identifier where applicable;
- a small validated payload or reference to authoritative records;
- creation and next-attempt timestamps;
- attempt count and processing status;
- an idempotency or deduplication key when the operation requires one;
- claim or lease information;
- the last failure classification and a safely redacted summary; and
- completion or terminal-failure time.

Payloads must be versioned and backward compatible with workers that can exist
during a coordinated deployment. Large files, secrets, raw payment data, and
unnecessary personal information do not belong in job payloads.

The outbox is not the audit log. It tracks operational intent and delivery;
actor-attributed business history remains in the appropriate audit or timeline
records.

### Creation and transaction boundary

Application services create outbox entries in the same PostgreSQL transaction
as the business records that require the asynchronous effect.

For example, accepting a client approval may atomically record:

- the terminal decision for the exact revision;
- the eligible draft invoice;
- the timeline event; and
- an outbox entry requesting invoice or notification processing.

If the transaction rolls back, none of those records exists. If it commits,
the work remains discoverable even if the application stops immediately.

No HTTP call, email delivery, Stripe request, object-storage operation, or queue
publication is awaited inside that transaction.

### Claiming and leases

Workers claim available jobs using an atomic database operation and a bounded
lease. Multiple workers may poll concurrently without processing the same job
under normal operation. PostgreSQL row locking with skip-locked behavior or an
equivalent atomic claim may be used.

A lease expires so another worker can recover a job after a crash. Completion
updates must verify the active claim so a delayed worker cannot overwrite a
newer's result.

Workers use bounded batches, randomized polling delay where appropriate, and
database connection limits that prevent job processing from starving the API.

### Idempotency

Every job handler documents its retry behavior. It must use one or more of:

- a unique database constraint for an effect that may exist only once;
- a processed-job or provider-event record committed with internal effects;
- a stable idempotency key supplied to an external provider that supports it;
- a compare-and-set transition from an expected state;
- detection of the already completed external object; or
- an operation that is naturally safe to repeat.

Marking a job complete is not sufficient idempotency. A worker may perform the
external action successfully and crash before recording completion, causing
the job to run again.

Financial jobs require business-level idempotency based on authoritative
provider and ledger identifiers. Notification deduplication must avoid confusing
duplicates while allowing a deliberately new notification for a later event.

### Retries and failure classification

Retryable failures use exponential backoff with jitter and a maximum delay.
Examples include provider timeouts, rate limits, and temporary service
unavailability.

Permanent failures are not retried indefinitely. Examples include an invalid
payload version, revoked destination, prohibited content, or a business state
that makes the requested operation invalid. Unknown failures have a bounded
retry policy and become terminal when attempts or age exceed the job-specific
limit.

Retry policies are configured by job type because an email notification,
receipt render, evidence scan, and payment reconciliation have different risk
and timing requirements.

### Terminal failures and replay

Terminally failed jobs remain visible in a failed state with redacted error
context. They are not silently deleted. Operational tooling must support:

- filtering and inspecting failed jobs;
- linking to the related business record and trace;
- retrying an eligible job with an audit trail;
- cancelling obsolete work without claiming it succeeded; and
- creating a corrected replacement job when the original payload is invalid.

Manual replay uses the original idempotency rules. Operators cannot bypass
authorization, immutable financial history, or lifecycle constraints merely
because a job failed.

### Ordering

Global ordering is not guaranteed. Where order matters, jobs use an aggregate
sequence, expected version, or state precondition. A handler receiving obsolete
work may safely no-op, delay, or supersede it according to the job contract.

StagePaid will avoid depending on strict queue ordering for correctness. Jobs
for different projects or aggregates may run concurrently.

### Managed queue integration

The initial implementation may process the PostgreSQL outbox directly. A
managed queue may later improve latency and absorb bursts:

1. the transaction commits an outbox entry;
2. a dispatcher publishes its identifier to the queue;
3. a consumer loads the authoritative job and business state;
4. the handler performs the idempotent operation; and
5. PostgreSQL records the result.

Queue messages are hints that work is ready, not the only copy of the work.
Periodic sweeping of undispatched and expired jobs recovers missed queue
notifications.

### Scheduling and recurring work

Delayed jobs store a `next_attempt_at` or equivalent availability time.
Recurring maintenance uses a scheduler that creates uniquely keyed job
instances for each intended occurrence. Scheduler retries must not create
unbounded duplicate work.

Time-critical product guarantees must account for scheduling delay, worker
capacity, provider latency, and retry windows rather than assuming exact
execution at a wall-clock instant.

### Retention

Completed operational jobs may be archived or deleted after a documented
retention period when their durable business and audit outcomes exist elsewhere.
Failed, financial, or security-relevant job metadata may require longer
retention.

Removing an outbox record must never remove the authoritative invoice, payment,
audit, notification outcome, or object metadata it helped create.

## Consequences

### Positive

- Business state and required asynchronous intent commit atomically.
- Work survives application crashes and temporary queue or provider outages.
- Idempotent handlers make retries safe rather than exceptional.
- PostgreSQL provides a simple initial job foundation without requiring a
  separate broker for the MVP.
- A managed queue can be added later without changing the source of truth.
- Visible attempts and terminal failures support operations, reconciliation,
  and debugging.
- Short database transactions avoid coupling external latency to critical
  business writes.

### Negative and tradeoffs

- At-least-once processing requires deliberate idempotency in every handler.
- PostgreSQL polling and job records add load to the primary database.
- Lease, retry, backoff, replay, and payload-version behavior require careful
  implementation and tests.
- External success followed by a worker crash can still cause duplicate calls;
  provider idempotency or reconciliation must contain the effect.
- Cross-job ordering is not automatic and must be designed where needed.
- Adding a managed queue introduces another operational component while the
  outbox must still be monitored and swept.

## Alternatives considered

### Perform side effects inside HTTP requests

This appears simple but increases latency and couples user-visible success to
provider availability. A response timeout also cannot reveal whether the side
effect occurred. It remains acceptable only for operations whose contract is
explicitly synchronous and safely retryable; durable follow-up still uses the
outbox.

### Publish directly to a queue after commit

A crash between database commit and publication can permanently lose required
work. Retrying publication without durable state can also produce uncontrolled
duplicates. The outbox closes that gap.

### Publish to a queue before commit

A worker may consume a message for a transaction that later rolls back or is
not yet visible. This reverses rather than solves the dual-write problem.

### Use a managed queue as the only job record

Managed queues provide valuable delivery and scaling features, but message
retention and acknowledgement do not necessarily provide the business linkage,
replay history, or atomic relationship with PostgreSQL changes StagePaid needs.

### Assume exactly-once delivery

Crashes and ambiguous network outcomes make end-to-end exactly-once execution
unavailable across PostgreSQL and external providers. StagePaid instead designs
for at-least-once delivery with idempotent effects.

### Change-data capture from business tables

Log-based change-data capture can publish committed changes reliably, but it
adds infrastructure and still requires stable event contracts and idempotent
consumers. It may become appropriate at greater scale; an explicit outbox is
more transparent for the initial system.

## Security and privacy implications

- Job payloads contain only the minimum data needed to locate and perform work.
- Secrets, verification codes, raw payment credentials, and private object
  contents are never embedded in queue or outbox payloads.
- Workers revalidate relevant authorization and current lifecycle state rather
  than trusting an old payload blindly.
- Worker and dispatcher credentials have only the database, queue, storage, and
  provider permissions their job types require.
- Error summaries, logs, traces, and operational tooling redact personal,
  payment, access-token, and evidence data.
- Manual retry and cancellation actions require authenticated operator access
  and create audit records.
- Poisoned or attacker-controlled payloads are schema-validated, size-bounded,
  and rejected without unsafe deserialization.

## Validation and enforcement

The implementation will enforce this decision through:

- integration tests proving business state and outbox intent commit or roll
  back together;
- duplicate-delivery and crash-point tests for every critical handler;
- unique constraints and provider idempotency tests where applicable;
- tests for lease expiry, concurrent claims, stale completion, retry backoff,
  terminal failure, and manual replay;
- payload schema and compatibility tests across supported releases;
- monitoring for queue age, undispatched jobs, attempt counts, lease expiry,
  failure rate, handler latency, and terminal failures;
- alerts tied to service objectives rather than raw job volume alone; and
- reconciliation jobs for external financial and storage effects.

## Revisit triggers

A new ADR should reconsider this decision when:

- PostgreSQL polling materially affects transactional workloads despite tuning
  and bounded worker behavior;
- job throughput, fan-out, delay precision, or geographic delivery exceeds the
  architecture's measured capacity;
- change-data capture provides a demonstrably safer or simpler publication
  path;
- independently deployed services require separate outboxes or event brokers;
- regulatory isolation requires dedicated processing infrastructure; or
- a provider offers an atomic integration that changes the dual-write model.

## Related decisions and documents

- [ADR-001: Start with a modular monolith](0001-modular-monolith.md)
- [ADR-003: Use PostgreSQL as the primary database](0003-postgresql-primary-database.md)
- [ADR-004: Use module-owned persistence and forward schema migrations](0004-persistence-and-migrations.md)
- [Initial system architecture](../architecture/initial-system-architecture.md)
- [Stage-to-payment sequence](../architecture/diagrams/stage-to-payment-sequence.mmd)
- GitHub issue #7: Record foundational architecture decisions
