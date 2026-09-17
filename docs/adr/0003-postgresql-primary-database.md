# ADR-003: Use PostgreSQL as the primary database

**Status:** Accepted

**Date:** 2026-09-16

**Decision owners:** Stagenum maintainers

## Context

Stagenum coordinates projects, staged agreements, submission revisions,
evidence metadata, client decisions, invoices, payment events, fees, refunds,
and audit history. These records are strongly related, and several business
transitions must update multiple records atomically.

The system must prevent duplicate terminal decisions, invoices, webhook
effects, and ledger entries even when requests or jobs are retried. It must also
preserve immutable historical records while efficiently querying current
project, invoice, and balance state.

The initial modular monolith needs one authoritative transactional store. The
product has no demonstrated requirement for globally distributed writes or a
different database for each module. A mature relational database fits the
domain's relationships, constraints, transactional invariants, and reporting
needs.

## Decision

Stagenum will use **PostgreSQL as its primary authoritative database**.

PostgreSQL will store relational business records, module-owned persistence,
append-only audit and financial events, transactional outbox entries, and
references to externally stored objects and provider records.

PostgreSQL will not store raw payment credentials or serve as the primary store
for uploaded evidence and generated binary documents. Those objects belong in
private object storage; the database stores their metadata, ownership,
integrity information, lifecycle state, and storage references.

## Decision details

### Authority and transactions

PostgreSQL is authoritative for Stagenum's internal representation of:

- identities, sessions, invitations, and project-scoped access grants;
- projects, stages, agreement versions, and lifecycle state;
- immutable submission revisions, evidence metadata, and client decisions;
- invoice snapshots, corrections, replacements, and balance projections;
- payment attempts and append-only financial ledger events;
- provider references such as Stripe object and event identifiers;
- notification intent, delivery outcomes, and transactional outbox records; and
- actor-attributed audit and project-timeline events.

Business changes that must succeed or fail together will use PostgreSQL
transactions. External network calls will not be held open inside those
transactions. A committed outbox record will durably represent required
external work.

### Module ownership

The modular monolith uses one PostgreSQL database without treating every table
as globally writable. Each domain module owns its tables and repository logic.
Other modules interact through explicit application interfaces rather than
directly modifying those tables.

Cross-module foreign keys and transactional reads are allowed when they protect
a documented invariant, but they must not become an informal path around module
ownership. Cross-module writes require an owning module's use case or an
explicitly reviewed coordinating transaction.

### Relational modeling and constraints

Core business state will use normalized relational tables with explicit keys,
foreign keys, nullability, and constraints. The database will enforce
invariants that remain true regardless of which application path performs a
write.

Examples include:

- one terminal client decision for an exact submission revision;
- at most one eligible invoice for an approval;
- unique provider event identifiers for webhook deduplication;
- unique idempotency keys within their defined operation scope;
- valid relationships between projects, stages, revisions, invoices, and
  ledger events; and
- nonnegative or otherwise bounded values where the domain requires them.

Application validation remains necessary for contextual rules and clear error
messages. It supplements rather than replaces database constraints.

### Identifiers and time

Internal records will use application-generated, non-sequential identifiers
where public exposure or distributed creation makes them appropriate. Provider
identifiers are stored separately and constrained within their provider and
account scope.

Authoritative timestamps will use timezone-aware PostgreSQL values and be
recorded in UTC. Display conversion happens at the interface boundary. Business
dates that intentionally have no time of day use a date type rather than a
timestamp.

### Money and financial events

Money will never use binary floating-point storage. Amounts will be represented
as integer minor units with an explicit ISO currency code unless a documented
currency or calculation requires a fixed-precision decimal representation.

Issued invoices and accepted financial events are not rewritten to simulate a
later outcome. Refunds, reversals, disputes, fee changes, and corrections create
new attributable records. Current balances and receipt views are derived from
authoritative invoice and ledger records, with projections permitted for query
performance when they can be rebuilt and reconciled.

### JSON usage

`jsonb` may be used for:

- retained external-provider payloads after sensitive fields are removed;
- versioned audit context and metadata whose shape varies by event type; and
- genuinely optional attributes that do not participate in core integrity
  rules.

Frequently queried, constrained, joined, permission-bearing, or financially
significant fields belong in typed relational columns. `jsonb` will not be used
as a substitute for intentional schema design.

### Files and sensitive data

Uploaded evidence, invoice PDFs, receipts, and exports will reside in private
object storage. PostgreSQL stores the object key, ownership, content type, size,
integrity digest where applicable, retention state, and authorization
relationship.

Raw card numbers, security codes, magnetic-stripe data, and equivalent payment
credentials must never enter Stagenum's database, logs, or analytics. Secrets
and verification codes must be hashed, encrypted, tokenized, or excluded as
appropriate to their threat model and lifetime.

### Availability, backup, and access

Production will use a managed PostgreSQL service when practical. Environments
will use separate databases and credentials. Connections will use encryption in
transit, least-privilege roles, bounded pools, and explicit timeouts.

Backups must be encrypted and periodically verified through restoration tests.
Point-in-time recovery, retention, replication, and recovery objectives will be
selected before production based on documented business requirements rather
than assumed from a provider's defaults.

Administrative access to production data must be restricted and auditable.
Routine application operations must not use database-owner or migration-owner
credentials.

## Consequences

### Positive

- ACID transactions support Stagenum's tightly related lifecycle and financial
  invariants.
- Foreign keys, uniqueness constraints, checks, and indexes protect integrity
  beneath every application entry point.
- Relational queries support project history, invoice explanation, financial
  reconciliation, and exports without immediately adding another datastore.
- PostgreSQL offers mature tooling, managed hosting, backup, replication, and
  operational knowledge.
- `jsonb`, full-text search, and extensions provide controlled flexibility
  without abandoning the relational model.
- A transactional outbox can commit business state and asynchronous intent
  atomically.

### Negative and tradeoffs

- One primary database is a shared operational dependency and potential blast
  radius for the modular monolith.
- Schema changes require disciplined, backward-compatible migrations and
  coordinated releases.
- Module ownership is not fully isolated by separate databases and therefore
  needs tooling and review enforcement.
- Connection limits, long transactions, poor indexes, and inefficient queries
  can affect otherwise unrelated workflows.
- Scaling writes remains primarily vertical or topology-dependent until a
  demonstrated need justifies partitioning or service extraction.
- PostgreSQL features can increase vendor portability costs if used without
  documenting their value.

## Alternatives considered

### MySQL or MariaDB

These are capable relational databases and could support the core product.
PostgreSQL is selected for its strong constraints, transactional behavior,
indexing options, `jsonb`, extensibility, and fit with append-only events and
reporting. The decision is based on product fit, not a claim that MySQL is
generally unsuitable.

### Document database as the primary store

A document database could make some evolving records convenient, but the core
domain contains durable relationships and cross-record invariants. Enforcing
revision, invoice, access, and ledger consistency in application code alone
would add risk without a demonstrated scaling benefit.

### Database per module

Separate databases would strengthen physical ownership but introduce
distributed consistency, replication, and operational costs before Stagenum
has independently deployed services or teams. Logical module ownership within
one database is sufficient for the current architecture.

### Managed backend database platform as the architectural decision

A platform that provides hosted PostgreSQL, authentication, APIs, or realtime
features may be chosen during deployment. The durable decision is PostgreSQL
and its data guarantees, not dependence on a specific hosting vendor or its
generated client APIs.

### Full event sourcing

Append-only audit and financial events are necessary, but reconstructing every
domain object exclusively from events would add projection, replay, and schema-
evolution complexity. Stagenum will use relational current state alongside
append-only history where immutability and explanation require it.

## Security and privacy implications

- Database roles and application repositories enforce least privilege and
  module ownership where practical.
- Row-level authorization remains an application responsibility unless a later
  ADR adopts PostgreSQL row-level security for a defined boundary.
- Sensitive fields require explicit classification, retention, encryption, and
  redaction rules.
- Private object access is authorized using database metadata, but binary
  evidence is delivered through short-lived, scoped access rather than public
  object URLs.
- Provider payload retention must exclude prohibited payment data and minimize
  unnecessary personal information.
- Audit and financial history require append-only application behavior and
  restricted administrative mutation paths.
- Backups, replicas, exports, and developer datasets carry the same privacy
  obligations as the primary database.

## Validation and enforcement

The implementation will enforce this decision through:

- version-controlled schema migrations reviewed with application changes;
- foreign keys, uniqueness constraints, checks, and appropriate transaction
  isolation;
- integration tests that exercise constraints, concurrent transitions,
  idempotency, and rollback behavior against PostgreSQL;
- migration tests from supported prior schema versions;
- query plans and performance tests for critical workflows;
- reconciliation checks between invoices, ledger events, and derived balances;
- backup restoration exercises and documented recovery procedures;
- automated checks preventing floating-point money columns and unreviewed
  destructive migrations; and
- monitoring for connection saturation, lock contention, replication lag,
  failed migrations, and storage growth.

## Revisit triggers

A new ADR should reconsider all or part of this decision when:

- measured traffic or data volume cannot meet established objectives after
  reasonable indexing, query, caching, pooling, partitioning, and scaling work;
- a module requires a specialized data model whose benefit exceeds the cost of
  another authoritative store;
- regulatory or geographic requirements demand physical data isolation;
- independent services and teams require separately operated persistence;
- recovery, availability, or global-write requirements exceed the selected
  PostgreSQL topology; or
- analytical workloads materially interfere with transactional operations.

Adding a secondary cache, search index, warehouse, or read replica does not by
itself replace PostgreSQL as the system of record. Any secondary datastore must
define its source, consistency model, rebuild procedure, access controls, and
failure behavior.

## Related decisions and documents

- [ADR-001: Start with a modular monolith](0001-modular-monolith.md)
- [ADR-002: Use TypeScript as the primary application language](0002-typescript-primary-language.md)
- [Initial system architecture](../architecture/initial-system-architecture.md)
- [Invoice and payment states](../product/invoice-payment-states.md)
- [System-container diagram](../architecture/diagrams/system-containers.mmd)
- GitHub issue #7: Record foundational architecture decisions
