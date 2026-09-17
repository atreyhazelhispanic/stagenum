# ADR-004: Use module-owned persistence and forward schema migrations

**Status:** Accepted

**Date:** 2026-09-16

**Decision owners:** Stagenum maintainers

## Context

Stagenum's PostgreSQL schema must evolve while preserving projects, immutable
submission revisions, invoices, financial events, access grants, and audit
history. The modular monolith also needs code-level persistence boundaries so a
route handler or unrelated module cannot casually bypass domain invariants.

TypeScript database libraries can improve type safety and developer experience,
but their generated types do not replace PostgreSQL constraints, migration
history, runtime validation, or deliberate transaction design. Selecting an ORM
before production use cases exist would bind the architecture to a tool without
evidence that its abstractions fit Stagenum's transactional and reporting
needs.

Schema changes must support safe deployment, rollback of application releases,
reproducible environments, and recovery from partially completed operational
work. Automatic production schema synchronization and destructive "push"
commands do not provide sufficient review or history for financial software.

## Decision

Stagenum will use **module-owned persistence adapters backed by PostgreSQL and
version-controlled, forward schema migrations**.

The PostgreSQL schema and committed migration history are authoritative. Domain
and application code will not depend directly on an ORM, query builder,
database client, or generated database model. Infrastructure adapters may use a
TypeScript database library or reviewed SQL behind module-owned repository and
transaction interfaces.

Production schema changes will be applied only through reviewed migrations.
The application will never infer or automatically synchronize a production
schema at startup.

## Decision details

### Persistence boundaries

Each domain module owns:

- its tables, constraints, indexes, and database naming conventions;
- the persistence adapters that read and write those tables;
- translation between database rows and domain values;
- queries that enforce the module's authorization and lifecycle rules; and
- tests for its persistence behavior and database invariants.

Domain entities and application use cases depend on narrow persistence
interfaces, not database-library types. Persistence adapters live in the
infrastructure layer and may expose neither raw rows nor a general-purpose
database client to presentation or domain code.

Repositories should model meaningful aggregate or use-case operations rather
than provide a generic CRUD interface. For example, an approval operation
should not be assembled by arbitrary callers from unrestricted `update`
methods.

### Commands, queries, and read models

State-changing commands use the owning module's application service and
persistence adapter. They validate expected state and perform required writes
inside an explicit transaction.

Read-only projections may join tables across modules when needed for project
history, dashboards, receipts, exports, or reconciliation. Such queries:

- do not grant authority to mutate another module's records;
- live in an explicitly owned query or reporting adapter;
- use least-privilege access where practical; and
- are covered by contract or integration tests when consumed externally.

Denormalized read models and cached projections must identify their
authoritative source and rebuild procedure.

### Transactions and concurrency

Transaction boundaries are defined by application use cases, not hidden inside
individual repository methods. A transaction context may be passed to multiple
module adapters when one invariant requires atomic cross-module changes.

Concurrency is handled deliberately using database constraints, conditional
writes, row locks, or an appropriate isolation level. Reading a record and then
writing it later without a concurrency control is insufficient for terminal
decisions, invoice creation, idempotency, or ledger application.

Transactions must remain short and must not wait for Stripe, email, object
storage, or other network services. Durable outbox entries are committed in the
same transaction as the business change and processed afterward.

### Database access library

The first production implementation may select a TypeScript query builder or
ORM after a focused evaluation. The selected tool must:

- support PostgreSQL transactions, constraints, and required data types without
  hiding their behavior;
- permit reviewed parameterized SQL for complex or performance-sensitive
  queries;
- avoid runtime schema synchronization in production;
- produce inspectable migrations or coexist cleanly with repository-owned SQL
  migrations;
- support integration testing against real PostgreSQL; and
- avoid leaking generated persistence models into domain and API contracts.

Choosing or replacing that library does not require a new architecture ADR if
these boundaries remain intact. A tool-specific ADR is appropriate if the tool
changes schema ownership, migration authority, runtime architecture, or domain
coupling.

### Migration format and ownership

Migrations are immutable, ordered, version-controlled artifacts. Each
migration includes a unique sortable identifier and descriptive name. Applied
migrations are recorded in a database migration-history table.

Although modules own their schema objects, the deployed modular monolith uses
one globally ordered migration stream so dependencies and release order are
unambiguous. A migration identifies the owning module in its location, name, or
metadata.

An applied migration is never edited or reordered. Corrections use a new
migration. Development databases may be recreated before shared use, but any
migration that could have reached another environment is treated as immutable.

### Forward-only production recovery

The normal production recovery path is a corrective forward migration, not an
automatic reversal of an already applied migration. Down migrations can destroy
data or become invalid after newer application writes occur.

Application releases must remain reversible during a schema rollout. This is
achieved with backward-compatible expand-and-contract changes:

1. **Expand:** add compatible tables, columns, indexes, or constraints without
   removing what the current application needs.
2. **Migrate:** deploy code that can operate during the transition; backfill
   existing rows through bounded, observable work.
3. **Switch:** move reads and writes to the new representation after validation.
4. **Contract:** remove obsolete schema only in a later release after no
   supported application version depends on it.

Restoring an application binary is not assumed to reverse a schema change.

### Data backfills

Large or externally dependent backfills do not run as one long migration
transaction. The schema migration creates the compatible structure; an
idempotent, resumable job migrates data in bounded batches with progress,
metrics, and reconciliation. Constraints that require completed data are added
or validated after the backfill succeeds.

Small deterministic metadata updates may remain in a migration when their lock
and execution impact is understood and tested.

### Destructive and locking changes

Dropping or renaming tables and columns, narrowing data types, adding blocking
constraints, and rebuilding large indexes require explicit review. Before
production, the change must document:

- data-retention and backup implications;
- expected locks and execution time;
- compatibility with the currently deployed and previous application version;
- abort, retry, and corrective-forward procedures; and
- monitoring used to confirm success.

Concurrent index creation or online provider capabilities should be used when
they reduce unacceptable write blocking. Migration tooling must account for
PostgreSQL statements that cannot run inside a transaction.

### Environment and deployment rules

Development, test, staging, and production use separate databases and
credentials. Production application credentials cannot create or alter schema.
A distinct, narrowly controlled migration identity applies migrations during a
deployment step before incompatible application code receives traffic.

Only one migration runner may advance a database at a time. Startup instances
verify schema compatibility but do not race to mutate it.

Seed data is separated from schema migrations unless a small reference value is
required for schema or application compatibility. Production customer data is
never sourced from repository fixtures.

## Consequences

### Positive

- Domain code remains independent of a particular ORM or query builder.
- Module ownership limits accidental cross-domain writes while retaining useful
  relational transactions.
- Reviewed migration history makes every schema transition reproducible and
  auditable.
- Expand-and-contract deployment reduces downtime and preserves application
  rollback options.
- Explicit concurrency and transaction boundaries protect lifecycle and
  financial invariants.
- Raw SQL remains available where PostgreSQL features, reporting, or query
  performance require it.
- A database library can be selected with implementation evidence rather than
  becoming an unsupported architectural assumption.

### Negative and tradeoffs

- Repository adapters and row-to-domain mapping add code compared with using
  generated ORM models everywhere.
- Global migration ordering requires coordination when modules change related
  schema.
- Expand-and-contract changes take multiple releases and temporarily retain
  duplicate structures or compatibility code.
- Forward correction demands operational discipline and tested backups rather
  than relying on convenient down migrations.
- Real PostgreSQL integration tests are slower and require more infrastructure
  than mocked repository tests.
- Tool-generated migrations still require human review and may need manual
  adjustment for locks, backfills, or PostgreSQL-specific behavior.

## Alternatives considered

### ORM models as domain models

Using generated persistence models throughout the application would reduce
mapping code, but it would couple domain behavior and API contracts to storage
shapes. It would also make module boundaries easier to bypass. Stagenum accepts
explicit adapters to keep persistence concerns at the infrastructure boundary.

### ORM-managed automatic schema synchronization

Automatically changing production schema from application models is convenient
in early development but obscures the reviewed sequence, locking impact, data
transformation, and compatibility plan. It is not suitable for the production
migration path.

### Handwritten SQL everywhere

SQL provides maximum control and remains permitted inside infrastructure
adapters. Requiring handwritten SQL for every operation would give up useful
TypeScript inference and composability without strengthening the architectural
boundary. The implementation may choose the appropriate balance.

### Reversible up-and-down migrations as the primary recovery plan

Down migrations can be useful in isolated development, but production data may
have changed after an up migration. Automatic reversal can then lose or
misinterpret data. Corrective forward migrations plus compatible deployments
provide a safer default.

### Independent migration stream per module

Separate streams would emphasize module autonomy, but one deployed application
and one database still need deterministic ordering for cross-module constraints
and compatible releases. A global order is simpler until modules become
independently deployed systems.

## Security and privacy implications

- Runtime application credentials lack schema-owner and migration privileges.
- Migration credentials are restricted, audited, and available only to the
  controlled deployment path.
- Migration logs and errors must not print secrets or sensitive record values.
- Backfills, copies, temporary columns, and backups retain the source data's
  classification and deletion obligations.
- Production data must not be copied into local or test databases without an
  approved, irreversible de-identification process.
- Repository and query adapters must enforce project and actor scope rather
  than trusting identifiers supplied by clients.
- Destructive migrations require confirmation that retention, legal hold,
  export, and audit requirements are satisfied.

## Validation and enforcement

The implementation will enforce this decision through:

- migration and persistence changes reviewed together with their owning use
  cases;
- continuous-integration tests that create a database from an empty schema;
- upgrade tests that apply pending migrations to representative prior schemas;
- integration tests against the supported PostgreSQL version;
- static import rules preventing domain and presentation code from importing
  database clients or persistence models;
- checks that the committed schema and migration history agree;
- migration linting or review for destructive operations and lock hazards;
- tests for concurrent commands, idempotency, constraints, and transaction
  rollback;
- post-migration health checks and reconciliation queries; and
- periodic restore exercises using production-equivalent backups.

## Revisit triggers

A new ADR should reconsider this decision when:

- independently deployed modules require separate schema ownership and release
  processes;
- the selected database tooling cannot safely express required PostgreSQL
  behavior;
- migration frequency or coordination becomes a measured delivery bottleneck;
- zero-downtime requirements demand a dedicated schema-change platform;
- data volume makes the current backfill and migration process unable to meet
  defined operational objectives; or
- regulatory requirements demand stronger separation of duties or data stores.

## Related decisions and documents

- [ADR-001: Start with a modular monolith](0001-modular-monolith.md)
- [ADR-002: Use TypeScript as the primary application language](0002-typescript-primary-language.md)
- [ADR-003: Use PostgreSQL as the primary database](0003-postgresql-primary-database.md)
- [Initial system architecture](../architecture/initial-system-architecture.md)
- GitHub issue #7: Record foundational architecture decisions
