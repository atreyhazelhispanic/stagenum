# ADR-009: Use Next.js on a managed Node.js container platform

**Status:** Accepted

**Date:** 2026-09-23

**Decision owners:** Stagenum maintainers

## Context

Stagenum needs a production runtime for its responsive web experience, HTTP API,
passwordless client access, Stripe webhooks, and asynchronous work. The runtime
must preserve the domain and persistence boundaries established by the modular
monolith rather than allowing framework handlers or hosting constraints to
become the architecture.

The repository's current Vinext application is a synthetic research prototype.
It contains no durable persistence, production authentication, external side
effects, or real payment processing. Its framework and Cloudflare deployment
exist to make research inexpensive and do not select the production stack.

The initial production system will be operated primarily by a solo founder. It
therefore favors managed infrastructure, a small number of deployable units,
predictable failure modes, and ordinary Node.js compatibility over edge-specific
optimization or independently deployed services.

## Decision

The production application will use **Next.js with TypeScript on the Node.js
runtime**, packaged as an OCI-compatible container.

One versioned application repository and one immutable image will provide two
process roles:

- a web process that serves the responsive application and HTTP API; and
- a worker process that claims and executes durable asynchronous jobs.

Both roles will import the same domain and application modules, use the same
PostgreSQL schema, and ship as one compatible release. They are separate runtime
processes, not microservices.

The image will run on a managed regional container platform that supplies TLS,
secret injection, deployment history, health checks, logs, and independent web
and worker scaling. A specific hosting vendor is intentionally deferred until a
bounded selection compares current price, regional availability, support, and
operational features against these requirements.

## Decision details

### Application framework boundary

Next.js will render the web application and expose route handlers under the
public HTTP boundary. Route handlers may authenticate, authorize, validate, and
translate HTTP requests, but business rules remain in framework-independent
application and domain modules.

The domain layer must not import Next.js, React, request or response objects,
hosting SDKs, database clients, Stripe SDK types, or object-storage SDK types.
Infrastructure adapters implement interfaces owned by the application or domain
boundary.

Stripe webhook handlers must read the unmodified request body, verify the
signature before parsing or processing the event, and delegate idempotent
recording to the payments application layer. Passwordless sessions use secure,
HTTP-only, same-site cookies and server-side authorization on every protected
operation.

### Runtime and image

- Production uses the repository-pinned Node.js major version and advances it
  through an explicit, tested maintenance change.
- The build produces one immutable image identified by source revision and image
  digest. Staging and production promote the same image rather than rebuilding
  from different source.
- The image contains no environment-specific configuration or secrets.
- The web process is stateless. Sessions, idempotency records, job intent, and
  business state remain in shared production services.
- The worker uses the same image with a different start command and can scale or
  restart independently from the web process.

### Background execution

Committed job intent remains in the PostgreSQL transactional outbox defined by
[ADR-005](0005-transactional-outbox-and-jobs.md). The initial worker may claim
outbox jobs directly with bounded batches, row locking, leases, exponential
backoff, and idempotency. This provides a credible early-production path without
requiring a queue before measured load justifies one.

A managed queue may later become the delivery transport. PostgreSQL remains the
source of truth for job intent; publishing uses an idempotent relay, and workers
continue to tolerate duplicate and out-of-order delivery. Queue adoption does
not create a separately owned service or move business rules out of the modular
monolith.

Long-running, CPU-heavy, or untrusted file processing must not execute in the
request path. It runs in a worker with explicit time, memory, retry, and file-size
limits or is delegated to a bounded managed service through an adapter.

### Configuration and secrets

Configuration is validated at process startup with a typed schema. A process
fails before accepting traffic when required configuration is missing or
invalid.

- Non-secret configuration is supplied through environment variables.
- Secrets are injected by the hosting platform's secret manager at runtime.
- `.env.example` documents names and safe example values only.
- Local secrets live in ignored developer environment files.
- Secrets never enter source control, container layers, client bundles, build
  logs, application logs, or error payloads.
- Encryption, session, Stripe webhook, database, storage, and email credentials
  can be rotated independently.

### Environment isolation

Local development, staging, and production are distinct trust boundaries.

| Responsibility | Local | Staging | Production |
| --- | --- | --- | --- |
| Purpose | Development and automated tests | Release validation with non-production data | Real customer traffic and records |
| Database | Disposable local PostgreSQL | Dedicated managed instance or database | Dedicated managed instance |
| Object storage | Local emulator or dedicated development bucket | Dedicated private staging bucket | Dedicated private production bucket |
| Stripe | Test mode and local webhook forwarding | Separate test-mode configuration | Live-mode account and secrets |
| Email | Captured locally; no external recipients by default | Restricted test recipients or sandbox | Approved production sender |
| Secrets | Ignored local environment file | Staging secret store | Production secret store with narrower access |
| Data | Synthetic fixtures | Synthetic or intentionally created test records | Customer data; never copied into lower environments |

Staging and production use separate credentials, databases, buckets, webhook
endpoints and signing secrets, email configuration, encryption material, and
application origins. A staging compromise must not grant production access.

### Deployment and migration

The deployment pipeline will:

1. install from the lockfile and run static checks, unit, integration, and
   relevant browser tests;
2. build and identify one immutable image;
3. deploy that image to staging and run database-backed smoke tests;
4. require explicit production promotion;
5. run forward-only schema migrations as a single, observable release step;
6. replace web instances gradually and verify readiness; and
7. replace or resume workers only when the schema and job contracts are
   compatible.

Schema changes follow expand-migrate-contract sequencing. Migrations must be
safe for the previously deployed application during a rolling release. Data
backfills run as resumable, observable jobs rather than blocking startup.

Rollback means redeploying a previously known-good image while the schema
remains backward compatible. Production deployment does not automatically run
down migrations or erase data. A release that crosses an incompatible schema or
external side-effect boundary requires a written roll-forward and recovery plan
before deployment.

### Health, observability, and recovery

The web process exposes separate checks:

- **liveness** confirms the process can respond and does not depend on optional
  external providers;
- **readiness** confirms the process may receive traffic, including required
  configuration, compatible schema, and a bounded database check.

Worker health includes heartbeat age, oldest pending-job age, active lease age,
retry volume, and terminal/dead-letter state. Deployments and alerts use these
signals rather than treating a running process as proof that jobs are moving.

Structured logs include environment, release, process role, request or job
correlation identifier, and safe outcome fields. Logs exclude session tokens,
verification codes, webhook secrets, raw payment details, signed object URLs,
and private evidence. Error tracking and metrics distinguish HTTP failure,
authorization denial, webhook lag, queue or outbox delay, and provider failure.

Database recovery relies on managed backups and point-in-time recovery, tested
through a documented restoration exercise before production data is accepted.
Object-storage versioning and retention controls are selected when the storage
provider is chosen. External calls remain retryable and idempotent so recovery
does not duplicate financial or client-visible events.

### Integration compatibility

- **PostgreSQL:** the Node.js process uses a pooled adapter; connection limits,
  transaction boundaries, and migration ownership are explicit.
- **Private object storage:** the evidence adapter targets an S3-compatible or
  equivalently portable API and issues short-lived scoped access only after
  authorization.
- **Durable jobs:** the worker begins from the transactional outbox and can add a
  managed transport without changing domain use cases.
- **Email:** delivery is behind a notification adapter; provider callbacks enter
  through authenticated HTTP endpoints and update delivery state idempotently.
- **Stripe:** hosted payment surfaces keep credentials outside Stagenum;
  verified webhooks remain payment authority under
  [ADR-007](0007-stripe-webhook-payment-authority.md).
- **TypeScript:** shared domain and application code follows
  [ADR-002](0002-typescript-primary-language.md); generated provider types do not
  leak into domain contracts.

### Local development

The supported local workflow runs the pinned Node.js version and PostgreSQL,
plus only the emulators or sandbox services needed for the feature under test.
It must support:

- one documented command to start required local infrastructure;
- one documented command each for migrations, the web process, and the worker;
- synthetic seed data that is safe to reset;
- locally captured email;
- Stripe test mode with signed webhook forwarding;
- object-storage emulation or an isolated development bucket;
- unit tests without external services and integration tests against disposable
  infrastructure; and
- the same configuration validation and migration artifacts used in deployed
  environments.

Local development does not require access to staging or production credentials.
The current `prototype/` application remains a separate research artifact until
production implementation deliberately replaces it; it is not migrated in
place merely because its interface is useful.

## Consequences

### Positive

- One language, repository, image, and release keep early operations tractable.
- Next.js supports the responsive interface and HTTP boundary without placing
  React or framework types in the domain.
- A conventional Node.js container preserves access to mature PostgreSQL,
  Stripe, storage, email, and observability libraries.
- Separate process roles isolate request latency from retries and slow external
  work while avoiding distributed domain ownership.
- Immutable promotion, explicit migrations, health checks, and environment
  separation make releases and recovery observable.
- The managed-platform contract leaves hosting vendors replaceable and avoids
  tying business code to an edge runtime.

### Negative and tradeoffs

- The team must maintain a container build and operate both web and worker
  processes.
- A regional deployment does not provide active-active multi-region operation.
- Next.js combines rendering and API concerns in one framework, so boundary
  enforcement requires tests, import rules, and review.
- Direct PostgreSQL outbox polling is intentionally modest and may need a managed
  queue as volume or latency requirements grow.
- Deferring the hosting vendor requires one additional bounded decision before
  production infrastructure is provisioned.
- Staging, backups, monitoring, and independent secrets create baseline cost
  before customer volume is large.

## Alternatives considered

### Promote the Vinext and Cloudflare prototype directly

This would minimize visible change and may offer inexpensive edge execution.
The prototype, however, was selected for research speed and contains synthetic
state. Promoting it would let a demonstration framework and its runtime
compatibility constraints select production architecture without evaluating
database connections, workers, migrations, recovery, or security boundaries.

Cloudflare may still provide DNS, edge protection, object storage, or a future
runtime if a separate ADR demonstrates that its constraints fit the production
domain and operational model.

### Next.js on a function-per-request serverless platform

Managed functions reduce server administration and scale to zero, but database
connection behavior, execution duration, background jobs, deployment skew, and
provider-specific runtime behavior add complexity to the initial transactional
system. This can be reconsidered if a platform demonstrates equivalent worker,
migration, observability, and rollback guarantees with lower operating burden.

### NestJS API with a separately built React application

NestJS offers explicit dependency injection and server-side structure. A
separate frontend and API would add build, deployment, origin, session, and
version-coordination surfaces before the product needs independent clients at
that boundary. The domain modules remain extractable if a dedicated API later
becomes valuable.

### Fastify API with a separately built React application

Fastify is small, fast, and well suited to APIs, but requires more application
assembly and the same separate-interface coordination. Its performance benefit
does not yet outweigh the operational simplicity of one full-stack deployment.

### Microservices or independent functions per domain module

These models allow independent scaling and deployment, but conflict with the
accepted modular-monolith boundary before measured scaling, reliability, or
team-ownership needs justify network and distributed-transaction costs.

## Security and privacy implications

TLS terminates at the managed platform edge, while the application still
authenticates and authorizes every request. Direct runtime origins are not
treated as trusted merely because they sit behind an edge proxy.

Production secrets and data remain isolated from lower environments. Runtime
identities receive only the database, object, queue, and secret permissions
needed for their process role. Signed URLs, session credentials, verification
codes, payment details, and private evidence are excluded from telemetry.

Deployments use immutable artifacts and attributable promotion. Migration,
administrative, reconciliation, and recovery actions are audited. Managed
backups, restoration exercises, idempotent processing, and forward-compatible
releases reduce the chance that a failed deployment causes data loss or
duplicate financial activity.

## Validation and enforcement

- Architecture tests or lint rules prevent domain modules from importing
  Next.js, React, provider SDKs, or another module's internal implementation.
- CI builds the production image and runs static, unit, integration, migration,
  and relevant browser checks before promotion.
- Deployment smoke tests verify health, database compatibility, authentication
  boundaries, signed webhook handling, and one safe background job in staging.
- Configuration schema tests fail for missing, malformed, or client-exposed
  secrets.
- Migration review verifies forward-only, rolling-release compatibility and a
  recovery plan for risky changes.
- Operational checks verify backup freshness, restore readiness, webhook lag,
  outbox age, retries, and worker heartbeat.
- Release metadata connects source revision, image digest, migration version,
  staging result, and production promotion.

## Revisit triggers

- Next.js prevents required HTTP, security, rendering, or framework-independent
  domain behavior.
- Edge placement shows a measured latency or cost benefit that outweighs runtime
  and data-access constraints.
- Sustained load, connection pressure, or job latency exceeds the managed
  platform or direct-outbox model.
- A domain requires materially different scaling, isolation, regulatory, or
  release ownership.
- Native or partner clients require an independently versioned public API.
- Hosting cost or reliability no longer meets documented service objectives.
- The selected platform cannot provide required regional placement, backup,
  secret, observability, rollback, or incident-response capabilities.

## Related decisions and documents

- [ADR-001: Start with a modular monolith](0001-modular-monolith.md)
- [ADR-002: Use TypeScript as the primary application language](0002-typescript-primary-language.md)
- [ADR-003: Use PostgreSQL as the primary database](0003-postgresql-primary-database.md)
- [ADR-004: Use module-owned persistence and forward schema migrations](0004-persistence-and-migrations.md)
- [ADR-005: Use a transactional outbox and idempotent background jobs](0005-transactional-outbox-and-jobs.md)
- [ADR-006: Use private object storage with signed access](0006-private-object-storage.md)
- [ADR-007: Treat verified Stripe webhooks as payment authority](0007-stripe-webhook-payment-authority.md)
- [ADR-008: Use passwordless, project-scoped client access](0008-passwordless-project-scoped-access.md)
- [Initial system architecture](../architecture/initial-system-architecture.md)
