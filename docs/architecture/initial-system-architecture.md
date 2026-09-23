# Initial System Architecture

**Status:** Proposed for MVP

**Last updated:** 2026-09-15

## Objective

Define a secure, auditable, and practical starting architecture for Stagenum's
MVP. The design supports staged agreements, immutable review revisions,
passwordless client access, private evidence, invoice issuance, payment
processing, notifications, and financial history without introducing
microservices before the product requires them.

This document defines logical boundaries and data flow. Individual technology
and provider choices are recorded in the
[architecture decision record index](../adr/README.md).

## Accepted architecture decisions

The following decisions govern implementation of this architecture:

1. [ADR-001: Start with a modular monolith](../adr/0001-modular-monolith.md)
2. [ADR-002: Use TypeScript as the primary application language](../adr/0002-typescript-primary-language.md)
3. [ADR-003: Use PostgreSQL as the primary database](../adr/0003-postgresql-primary-database.md)
4. [ADR-004: Use module-owned persistence and forward schema migrations](../adr/0004-persistence-and-migrations.md)
5. [ADR-005: Use a transactional outbox and idempotent background jobs](../adr/0005-transactional-outbox-and-jobs.md)
6. [ADR-006: Use private object storage with signed access](../adr/0006-private-object-storage.md)
7. [ADR-007: Treat verified Stripe webhooks as payment authority](../adr/0007-stripe-webhook-payment-authority.md)
8. [ADR-008: Use passwordless, project-scoped client access](../adr/0008-passwordless-project-scoped-access.md)

Later decisions may refine provider and implementation details without
silently changing these accepted boundaries. Material changes are recorded in
new ADRs that supersede the affected decision.

## Architectural approach

Stagenum begins as a **modular monolith** with one deployable application and
one primary relational database. Modules enforce business boundaries inside the
codebase, while durable jobs isolate communication with external systems.

This approach provides:

- one transactional boundary for closely related project, review, invoice, and
  ledger changes;
- fewer distributed-failure modes during MVP development;
- straightforward local development, testing, deployment, and observability;
- explicit module seams that can become services later if scale or ownership
  requires it; and
- a stable application API that future iOS and Android clients can reuse.

The clickable prototype is a research artifact. Its Vinext implementation and
in-memory state do not select the production application stack.

## System context

Stagenum serves two primary actors:

- **Provider:** defines projects and stages, submits work, responds to Change
  Requests, issues invoices, and reviews financial records.
- **Client:** enters through a scoped invitation, reviews submitted evidence,
  sends a Change Request or approval, views invoices, and submits payment.

The application integrates with:

- an email delivery provider for invitations, verification codes, and business
  notifications;
- Stripe Connect for provider onboarding, payment collection, refunds,
  disputes, fees, settlement, and authoritative payment events; and
- managed object storage for private evidence and generated documents.

See [`diagrams/system-containers.mmd`](diagrams/system-containers.mmd) for the
container-level view.

![Stagenum system container architecture](diagrams/system-containers.svg)

The primary stage-to-payment path is shown in
[`diagrams/stage-to-payment-sequence.mmd`](diagrams/stage-to-payment-sequence.mmd).
It includes the Change Request branch and distinguishes committed business
transactions from eventually delivered notifications, documents, and processor
outcomes.

![Stagenum stage-to-payment sequence](diagrams/stage-to-payment-sequence.svg)

## Runtime containers

### Web application

The responsive web application provides provider and client experiences. It:

- renders only data authorized for the current actor and project scope;
- sends commands and queries through the application API;
- uploads evidence through short-lived, scoped upload instructions;
- uses secure, HTTP-only session cookies rather than browser-accessible session
  credentials; and
- never handles raw card or bank credentials outside Stripe-hosted elements.

Future native applications use the same application API and do not receive
direct database or unrestricted object-storage access.

### Application API

The API is the only public entry point for Stagenum business operations. It:

- authenticates sessions and authorizes every protected operation;
- validates commands at the trust boundary;
- coordinates domain modules and database transactions;
- issues scoped evidence-upload and download access;
- provides idempotency for retried state-changing requests; and
- exposes provider and client views without leaking internal or cross-tenant
  data.

### Background worker

The worker consumes durable jobs created by committed application transactions.
It handles:

- email and notification delivery;
- document and receipt generation;
- safe evidence post-processing, such as metadata removal or malware scanning;
- Stripe reconciliation and delayed payment outcomes; and
- retryable external side effects.

Business records are committed before jobs run. A failed email or processor
call therefore cannot erase or partially commit the underlying decision.

### Relational database

The primary database is authoritative for:

- providers, clients, memberships, and scoped invitations;
- projects, stages, agreement versions, and scope changes;
- immutable submission revisions and evidence metadata;
- Change Requests, approvals, and withdrawals;
- invoice snapshots and corrections;
- payment attempts and append-only financial events;
- notification intent and delivery state;
- idempotency records and transactional outbox jobs; and
- actor-attributed audit and shared-timeline events.

Derived states—such as invoice balance and project paid-to-date—are calculated
from authoritative records and ledger events rather than maintained as manually
editable flags.

### Private object storage

Object storage contains evidence files, generated invoice documents, receipts,
and permitted exports. Objects are private by default and addressed through
opaque identifiers rather than user-supplied filenames.

The database stores object metadata and authorization relationships. Clients
receive short-lived access only after the API verifies their session, role,
project scope, and the requested object's relationship to that project.

### Durable job transport

A managed queue is preferred when available. A relational transactional outbox
remains the source of truth for job intent, preventing a database commit from
succeeding while its corresponding notification or processor job is silently
lost.

Workers must expect duplicate delivery. Each job and external callback is
handled idempotently.

## Domain modules

The modular monolith begins with these internal boundaries:

| Module | Owns | Does not own |
| --- | --- | --- |
| Identity and access | Provider sessions, client invitations, email-code verification, project grants, revocation | Project decisions or payment credentials |
| Projects and agreements | Projects, stages, agreement versions, scope changes, cancellation | Submission review decisions |
| Submissions and reviews | Immutable revisions, evidence associations, Change Requests, approvals, withdrawals | Invoice issuance or payment settlement |
| Billing | Draft and issued invoice snapshots, corrections, balance projections | Raw payment credentials |
| Payments and ledger | Payment attempts, Stripe references, refunds, reversals, disputes, fees, payouts, derived balances | Editing issued invoices or approved revisions |
| Evidence | Object metadata, upload lifecycle, visibility, retention, removal requests | Arbitrary object-store access |
| Notifications | Message intent, templates, recipient routing, delivery attempts | Deciding whether a business transition occurred |
| Audit and timeline | Immutable actor, business-event, and visibility records | Secrets or unrestricted security telemetry |

Modules communicate through application services and typed domain events, not
by modifying another module's records directly from presentation code.

## Primary transactional flows

### Submit a stage revision

In one database transaction, the application:

1. verifies provider authority and current stage eligibility;
2. creates an immutable submission revision and evidence associations;
3. changes the stage's derived review state;
4. records the actor-attributed business event; and
5. writes an outbox job for the client notification.

### Record a client decision

In one database transaction, the application:

1. verifies the client session and project grant;
2. locks or otherwise protects the pending revision from concurrent decisions;
3. records exactly one terminal decision for that revision;
4. records an approval or Change Request with its original content;
5. creates a draft invoice only after an eligible approval; and
6. writes timeline and notification jobs.

A unique database constraint enforces one terminal decision per revision.

### Issue an invoice

Invoice issuance creates a new immutable invoice snapshot with an official
identifier. It never edits the approval or derives payment. Corrections produce
linked events and, when necessary, a replacement invoice rather than rewriting
the issued document.

### Process a payment

Starting a payment creates a payment-attempt record and a Stripe operation with
the same Stagenum idempotency key. A payment attempt does not change the
invoice balance.

An authenticated Stripe webhook records the authoritative financial event in a
database transaction, updates derived projections, writes the shared timeline
event, and schedules receipts and notifications. Duplicate callbacks return the
previously recorded result.

## Trust and security boundaries

### Public network boundary

All browser and future mobile traffic is untrusted. TLS terminates at the edge,
and the API authenticates, validates, authorizes, and rate-limits requests.

### Tenant and project boundary

Provider membership alone does not grant access to every provider record.
Authorization includes organization, role, project, stage, and action scope.
Client sessions are restricted to grants created from verified invitations.

### Evidence boundary

Object-store identifiers are not authorization. The API authorizes each upload
and download, and signed access expires quickly. Notification messages do not
embed sensitive evidence.

### Payment boundary

Stripe collects sensitive card and bank credentials. Stagenum stores only the
minimum processor references and masked display details required for business
records. Webhook signatures are verified against the raw request body before
events enter the financial ledger.

### Internal operations boundary

Administrative and support access is separate from normal provider access,
least-privileged, strongly authenticated, and audited. Application logs exclude
verification codes, session credentials, private evidence content, and payment
credentials.

## Consistency and failure model

- Database transactions protect business invariants inside the modular
  monolith.
- Optimistic concurrency or row locking prevents conflicting terminal actions.
- Unique constraints enforce identifiers and one-time business relationships.
- Idempotency keys protect user retries, worker retries, and processor retries.
- The transactional outbox connects committed state with eventual side effects.
- Webhooks may arrive late, duplicated, or out of order; processing uses event
  identifiers and processor timestamps without trusting arrival order alone.
- External delivery failure changes delivery state, not the committed business
  event.
- User-facing status distinguishes pending, successful, failed, and unknown
  outcomes rather than guessing.

## Data ownership and retention

Stagenum remains authoritative for agreements, submissions, decisions,
invoices, application ledger events, and their relationships. Stripe remains
authoritative for processor outcomes, fees, disputes, and settlement events;
Stagenum records reconciled representations and source references.

Retention is record-class specific. Final financial records use the documented
seven-year U.S.-first baseline, subject to pre-launch legal review. Evidence,
authentication telemetry, and ordinary application logs receive separate,
purpose-limited schedules. Account closure does not silently destroy records
that Stagenum must retain, but access and eventual deletion remain governed by
documented policy.

## Observability

Every request, background job, and external callback receives a correlation
identifier. Operational telemetry includes:

- request latency and error rates;
- queue age, retry count, and dead-letter volume;
- email delivery outcomes without message secrets;
- Stripe webhook lag, signature failures, and reconciliation differences;
- evidence-processing failures;
- authorization denials and rate-limit events; and
- invariant violations requiring operator review.

Business audit records and operational logs are separate. Logs help operate the
system; audit records explain durable business actions.

## Deployment shape

The initial production environment may use managed platform services, but keeps
these independently scalable processes:

1. web and API runtime;
2. background worker;
3. relational database;
4. private object storage; and
5. durable job transport.

Development, staging, and production use separate credentials, databases,
buckets, Stripe environments, email configuration, and encryption material.
Production data is never copied into demo fixtures.

[ADR-009](../adr/0009-production-runtime-and-deployment.md) selects Next.js
on the Node.js runtime, packaged as one immutable container image with separate
web and worker process roles. It also defines environment isolation,
configuration and secret handling, deployment sequencing, forward-only
migrations, rollback boundaries, health checks, observability, and local
development expectations. The current Vinext application remains a synthetic
research prototype and does not select or evolve in place into this production
architecture.

## Explicitly deferred

- Splitting domain modules into networked microservices
- Event sourcing as the primary persistence model
- Multi-region active-active writes
- Native mobile implementation and mobile-specific authentication
- Real-time collaborative editing
- Offline mutation queues
- General client accounts and social login
- Search infrastructure beyond relational capabilities
- Analytics warehouses and machine-learning pipelines
- Final cloud, object-storage, managed-queue, and email-provider selections

## Architecture acceptance criteria

- The provider and passwordless client paths cross one authenticated API.
- Every protected operation is authorized at request time.
- Submitted revisions, decisions, issued invoices, and financial events cannot
  be silently overwritten.
- Evidence remains private and is accessed through short-lived scoped grants.
- Raw payment credentials remain within Stripe-hosted surfaces.
- Payment attempts remain distinct from authoritative payment events.
- Retried commands, jobs, and webhooks do not duplicate business outcomes.
- Database commits cannot silently lose required external side effects.
- Audit records identify the actor, action, target, revision, and timestamp.
- The architecture supports a future mobile client without exposing persistence
  systems directly.

## Follow-up architecture decisions

The accepted ADRs define the foundational boundaries needed for the next
implementation phase. Later ADRs should be created when implementation evidence
requires a durable decision, including:

1. TypeScript database-access library;
2. managed container-hosting vendor;
3. object-storage, queue, and email providers;
4. Stripe Connect charge and account model;
5. invoice and receipt document generation; and
6. observability provider and service objectives.
