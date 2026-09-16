# ADR-001: Start with a modular monolith

**Status:** Accepted

**Date:** 2026-09-15

**Decision owners:** StagePaid maintainers

## Context

StagePaid must coordinate several closely related business lifecycles:

- provider and passwordless client access;
- projects, staged agreements, and scope changes;
- immutable submission revisions and evidence;
- approval, Change Request, and withdrawal decisions;
- invoice snapshots and corrections;
- payment attempts, authoritative processor events, refunds, and disputes; and
- notifications, audit records, and client-visible history.

Many transitions must preserve invariants across those capabilities. For
example, one terminal client decision applies to one exact submission revision,
an eligible approval creates at most one draft invoice, and a successful
payment event changes the derived balance without rewriting the issued invoice.

StagePaid is currently a small product with an evolving domain, one coordinated
delivery team, and no measured workload that requires independently deployed
domain services. Introducing network boundaries at this stage would add
distributed transactions, versioned service contracts, additional deployment
units, and more failure modes before those costs solve a demonstrated problem.

An unstructured monolith would avoid that operational complexity but would make
it easy for route handlers, database queries, payment adapters, and business
rules to become tightly coupled. That would weaken the auditability and domain
invariants on which StagePaid's value depends.

## Decision

StagePaid will begin as a **TypeScript modular monolith**.

Domain capabilities will be isolated through code-level module boundaries,
owned persistence, explicit public interfaces, and typed domain events. The
application will be released as one coordinated system backed by one primary
relational database.

The HTTP application and background worker may run and scale as separate
processes, but they will share the same domain modules, schema, and release
lifecycle. Internal domain modules will communicate in-process rather than
through network APIs.

Networked microservices are deferred until measured scaling, reliability,
security, regulatory, or team-ownership requirements justify their operational
cost.

## Decision details

### Initial modules

The initial module boundaries are:

1. **Identity and access** — provider sessions, client invitations, email-code
   verification, project grants, and revocation.
2. **Projects and agreements** — projects, stages, agreement versions, scope
   changes, cancellation, and archival.
3. **Submissions and reviews** — immutable revisions, evidence associations,
   Change Requests, approvals, and withdrawals.
4. **Billing** — draft and issued invoice snapshots, invoice identifiers,
   corrections, voids, replacements, and balance queries.
5. **Payments and ledger** — payment attempts, processor references,
   authoritative financial events, fees, refunds, disputes, payouts, and
   derived financial projections.
6. **Evidence** — object metadata, upload lifecycle, visibility, retention, and
   removal workflows.
7. **Notifications** — notification intent, templates, recipient routing,
   delivery attempts, and delivery outcomes.
8. **Audit and timeline** — immutable actor-attributed business events and
   role-appropriate project history.

These boundaries may be refined as implementation exposes better domain
language. Moving a responsibility between modules requires an intentional
review, not an incidental cross-module database write.

### Module contract

Each module:

- owns its domain rules and application use cases;
- owns the database tables and repositories associated with those rules;
- exposes a deliberate public interface to other modules;
- hides internal domain, persistence, and adapter implementations;
- validates its invariants even when called by another trusted module;
- emits typed events only after the corresponding business transition is
  committed; and
- remains independent of React components, HTTP request objects, and provider
  SDK types in its domain layer.

A module must not:

- write another module's tables directly;
- import another module's internal files;
- use presentation-layer state as authoritative business state;
- call Stripe, email, or object storage from domain entities; or
- duplicate a business event because a request, job, or webhook was retried.

### Application coordination

Application services coordinate use cases that cross module boundaries. They
may use one relational transaction when a business invariant requires atomic
changes across closely related records.

Examples include:

- recording an approval and creating its one eligible draft invoice;
- issuing an immutable invoice and recording its timeline event; and
- recording an authoritative payment event, deriving the new balance, and
  writing receipt and notification jobs.

External side effects do not run inside the database transaction. The
transaction records durable intent through an outbox; a worker performs the
side effect idempotently after commit.

### Source organization

The intended structure is conceptually:

```text
src/
  modules/
    identity/
    projects/
    reviews/
    billing/
    payments/
    evidence/
    notifications/
    audit/
```

Each module may contain:

```text
domain/          entities, value objects, policies, and events
application/     commands, queries, and use cases
infrastructure/  persistence and external-provider adapters
public.ts        exports available to other modules
```

This is a boundary model, not a requirement to create empty folders before the
associated behavior exists.

### Deployment model

The modular monolith permits multiple runtime processes without creating
microservices:

- the web/API process handles synchronous commands and queries;
- the worker process handles durable asynchronous jobs; and
- both use the same versioned domain code and relational schema.

They are deployed as one compatible release. A worker from an incompatible
release must not consume jobs or access schema changes it cannot understand.

## Consequences

### Positive

- Closely related business transitions can use ordinary relational
  transactions.
- Local development and end-to-end testing require fewer independently running
  application services.
- Domain boundaries remain visible without adding network latency or partial
  failure between every capability.
- The small initial team can change related workflows in one coordinated
  release.
- Observability, authentication, deployment, and secrets management begin with
  fewer operational surfaces.
- Explicit module contracts provide potential extraction seams if a service is
  justified later.
- Future web and mobile interfaces can reuse application use cases through the
  same external API.

### Negative and tradeoffs

- Modules share a release cadence and cannot be deployed independently.
- A defect or resource spike in one module can affect the same application
  runtime unless process and resource controls contain it.
- One primary database limits independent storage choices and scaling strategies
  for individual modules.
- Boundary discipline depends on automated checks and code review; process
  isolation does not enforce it for us.
- Careless shared utilities or cross-module queries can gradually create an
  unstructured monolith.
- Scaling the whole API process may be less efficient than scaling one narrowly
  isolated service.
- Later extraction, if justified, still requires data migration, contract
  design, and operational work.

## Alternatives considered

### Networked microservices from the beginning

Independent services could isolate deployments, runtime failures, and scaling.
StagePaid does not yet have the load, team topology, or independently evolving
domains needed to offset the cost of service discovery, network authorization,
distributed tracing, contract compatibility, data ownership across services,
and partial-failure handling.

This remains a possible future architecture, not a rejected pattern for all
stages of the product.

### Unstructured monolith organized by technical layer

A conventional controllers/services/models structure would be initially
familiar, but business rules would likely span generic service and model
layers. It provides weak ownership for the exact revision, invoice, and ledger
invariants StagePaid must preserve.

### Independent serverless function per operation

Operation-specific functions can scale independently, but organizing the domain
around deployment handlers would fragment shared transactions and encourage
business logic in transport code. Serverless infrastructure may still host the
modular monolith if it preserves module and transaction boundaries.

### Event sourcing as the primary persistence model

StagePaid needs immutable business and financial events, but that requirement
does not make full event sourcing necessary. Event sourcing would add replay,
projection versioning, event-schema evolution, and operational complexity before
the team has demonstrated a need for it.

The selected model uses relational current records plus append-only events where
history and financial explanation require them.

## Security and privacy implications

- One external application API centralizes authentication, authorization,
  validation, rate limiting, and audit correlation.
- Internal in-process calls are not automatically trusted; module use cases
  still validate actor, tenant, project, and action scope.
- Client access remains limited to explicit project grants rather than broad
  provider or database access.
- External adapters receive the minimum required data and remain outside domain
  entities.
- A shared database does not authorize arbitrary cross-module reads. Repository
  access and database roles should be narrowed where practical.
- Operational logs and errors must not expose verification codes, session
  credentials, private evidence, or payment credentials across modules.
- A compromise of the monolith has a larger potential blast radius than a
  strongly isolated service architecture, increasing the importance of least
  privilege, secrets isolation, dependency hygiene, and defense in depth.

## Validation and enforcement

The implementation will enforce this decision through:

- import-boundary rules that prevent access to another module's internal files;
- a small explicit public surface for every module;
- repositories scoped to records owned by their module;
- schema and code review for cross-module writes;
- unit tests for module invariants;
- integration tests for cross-module transactions and database constraints;
- end-to-end tests for provider, client, invoice, and payment workflows;
- idempotency tests for commands, workers, and webhooks; and
- architecture checks in continuous integration.

The project should prefer a build-time failure over relying only on written
conventions when a boundary can be checked automatically.

## Revisit triggers

A new ADR should reconsider part of this decision when evidence shows one or
more of the following:

- one module requires materially different availability, latency, geographic,
  or scaling characteristics;
- resource contention repeatedly harms unrelated workflows despite reasonable
  process-level controls;
- regulatory or security requirements demand stronger runtime or data
  isolation;
- separate teams need independent ownership and release cadences;
- deployment frequency or coordination becomes a measured delivery bottleneck;
- one module requires a different persistence model that cannot be supported
  safely inside the shared database;
- failure containment cannot meet established reliability objectives; or
- extraction demonstrably reduces total system complexity rather than merely
  redistributing it.

High user count alone does not require microservices. Any extraction proposal
must identify the boundary, data ownership, contract, migration path,
operational owner, and failure behavior.

## Related decisions and documents

- [Initial system architecture](../architecture/initial-system-architecture.md)
- [System-container diagram](../architecture/diagrams/system-containers.mmd)
- [Stage-to-payment sequence](../architecture/diagrams/stage-to-payment-sequence.mmd)
- [Staged-work lifecycle](../product/staged-work-lifecycle.md)
- [Invoice and payment states](../product/invoice-payment-states.md)
- [Client access](../product/client-access.md)
- GitHub issue #7: Record foundational architecture decisions
