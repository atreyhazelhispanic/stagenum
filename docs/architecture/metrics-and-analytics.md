# Metrics and Analytics Instrumentation

**Status:** Accepted MVP measurement plan

**Last updated:** 2026-09-27

## Purpose

This document defines how Stagenum measures product use, workflow outcomes,
reliability, AI assistance, cost, and revenue without collecting unnecessary
personal, project, evidence, or financial content.

Measurement exists to answer bounded product and operational questions. It does
not create a second business ledger, replace security telemetry, or justify
collecting data merely because it might become useful.

## Measurement principles

1. **Authoritative records stay authoritative.** PostgreSQL business and
   financial records determine project, approval, invoice, payment, refund,
   fee, and balance facts. Analytics events may describe that a transition
   occurred, but never become proof that it occurred.
2. **Measure outcomes, not customer content.** Events carry typed categories,
   timestamps, counts, durations, result codes, and pseudonymous correlation
   identifiers. They do not carry names, addresses, messages, scope text,
   filenames, evidence, invoice descriptions, or raw prompts and outputs.
3. **Emit server-side for consequential events.** Client events may measure
   interface discovery and abandonment. Completion, approval, invoice, and
   financial outcomes are emitted only after the server commits or derives the
   authoritative result.
4. **Separate data planes.** Product analytics, operational telemetry, security
   telemetry, and business audit records have different purposes, access, and
   retention. One store is not reused as an unrestricted substitute for the
   others.
5. **Version the contract.** Event names, schemas, KPI definitions, and
   dashboard queries are reviewed artifacts. A changed meaning receives a new
   version rather than silently changing historical interpretation.
6. **Optimize for decisions.** Every event must name the question it supports,
   an owner, and a deletion or aggregation rule. Unused events are removed.

## Four measurement planes

| Plane | Purpose | Examples | Not permitted |
| --- | --- | --- | --- |
| Business records | Authoritative customer and financial history | approvals, issued invoices, payment events, fee entries | replacing facts with analytics counters |
| Product analytics | Understand adoption and workflow completion | onboarding funnel, review turnaround, feature use | customer content, secrets, exact evidence metadata |
| Operational telemetry | Operate the application and meet service objectives | latency, error rate, outbox age, dependency health | durable business meaning or unrestricted payloads |
| Security telemetry | Detect and investigate abuse and control failures | verification failures, authorization denials, suspicious volume | marketing segmentation or routine product experimentation |

`activity_records` remain actor-attributed business history. They are not copied
wholesale into an analytics provider. Approved metrics are derived from typed
columns or emitted as minimized events.

## Event contract

Product events use a shared envelope:

```text
event_id             random UUID used for deduplication
event_name           stable namespaced identifier
event_version        positive integer
occurred_at          UTC event time
environment          local, test, staging, or production
release_id           deployed source/image identifier
source               web, api, worker, webhook, or scheduled job
actor_type           provider, client, operator, system, or anonymous
tenant_key           environment-scoped pseudonymous business key when needed
workflow_key         short-lived pseudonymous correlation key when needed
result               allowlisted outcome category
properties           allowlisted, schema-validated low-cardinality fields
```

The analytics adapter generates pseudonymous keys with a keyed digest and an
environment-specific secret. It does not send raw user, business, client,
project, stage, invoice, payment, session, or object identifiers. Keys must not
be reversible or shared across staging and production. Rotation is documented;
analytics that no longer joins across a rotation remains valid in aggregate.

Events are idempotent where they describe a committed server outcome. The event
ID or a deterministic safe deduplication reference prevents retries from
inflating counts. Analytics delivery failure never rolls back a customer
transaction; a bounded outbox job may deliver the event later.

## MVP event taxonomy

### Acquisition and activation

| Event | Emitted when | Safe properties |
| --- | --- | --- |
| `provider.account_created.v1` | provider account creation commits | acquisition channel category, invitation present |
| `provider.business_created.v1` | first provider business commits | business-size bucket when voluntarily supplied |
| `project.created.v1` | first or later project commits | first-project boolean, stage-count bucket |
| `client.invitation_sent.v1` | invitation job is accepted for delivery | delivery-channel category, first-invitation boolean |
| `client.access_verified.v1` | project-scoped grant/session commits | verification method category, attempt-count bucket |

The MVP activation milestone is a provider business that creates a project and
sends its first client invitation. A later research decision may change this
definition only by versioning the metric.

### Stage-to-payment workflow

| Event | Emitted when | Safe properties |
| --- | --- | --- |
| `stage.created.v1` | stage commits | position bucket, agreed-value bucket, currency |
| `submission.revision_submitted.v1` | immutable revision commits | revision-number bucket, image-count bucket |
| `review.opened.v1` | verified client first opens the pending revision | invitation-age bucket, device-class category |
| `review.decision_recorded.v1` | terminal decision commits | approval, Change Request, or withdrawal; revision bucket |
| `invoice.issued.v1` | immutable invoice commits | amount bucket, logo-used boolean, currency |
| `payment.attempt_started.v1` | logical payment attempt commits | method category, amount bucket |
| `payment.authoritative_outcome.v1` | verified payment event commits | success/failure category, method category, failure class |
| `receipt.viewed.v1` | an authorized participant opens a receipt | actor type, first-view boolean |

Amounts are bucketed in product analytics. Exact values, processor fees,
Stagenum fees, refunds, and net amounts remain in the financial records and are
queried through an access-controlled reporting projection.

### Feature usage

The MVP initially measures:

- optional provider-logo upload, selection, replacement, and issued-invoice use;
- evidence attachment counts using coarse buckets (`0`, `1-3`, `4-7`, `8-10`);
- Change Request use and revision count;
- invoice and receipt export outcomes; and
- manual versus assisted completion once an assistance feature exists.

Feature events record use and outcome, not file names, logo or evidence content,
messages, invoice text, or export contents.

### Beta fee measurement

During beta, the normal Stagenum fee may be calculated and displayed as
**Beta waived**. The authoritative ledger records whether the fee was assessed,
waived, returned, or charged. Reporting may derive:

- gross payment volume;
- hypothetical Stagenum fee at the configured rate;
- actual Stagenum fee charged;
- beta fee waived; and
- processing fee and provider net from authoritative payment entries.

Product analytics receives only amount buckets and the boolean/category that a
fee was waived. It does not independently calculate revenue.

## Funnel and business definitions

Each metric has one numerator, denominator, clock, and source of truth.

| Metric | Definition | Source |
| --- | --- | --- |
| Provider activation rate | businesses sending a first invitation within 14 days / new businesses eligible for 14 days | business and invitation records |
| Client access conversion | verified project grants / delivered invitations, grouped by invitation cohort | invitation, delivery, and grant records |
| Submission-to-review rate | revisions first opened by a client within 7 days / submitted revisions eligible for 7 days | revision and minimized first-open event |
| First-pass approval rate | revision-1 approvals / revision-1 terminal decisions | immutable decisions |
| Change Request recovery rate | stages later approved / stages receiving a Change Request | decisions and approvals |
| Approval-to-invoice time | median duration from committed approval to issued invoice | approval and invoice timestamps |
| Invoice-to-payment time | median duration from invoice issuance to authoritative successful payment | invoice and payment events |
| Payment success rate | successful logical attempts / terminal logical attempts | attempts plus authoritative events |
| Workflow completion rate | projects reaching configured paid/closed outcome / activated projects in a mature cohort | project and financial records |
| Logo adoption | issued invoices with logo snapshot / all issued invoices | invoice snapshots |

Early cohorts are reported separately from mature cohorts so incomplete recent
work is not mislabeled as abandonment. Internal dashboards show counts beside
percentages and suppress segmentation that would expose very small groups.

## AI assistance metrics

AI image interpretation is deferred beyond the MVP, but future text or form
assistance follows [ADR-010](../adr/0010-agent-assisted-workflows.md). For every
bounded workflow, record:

- workflow, prompt, schema, model-policy, and evaluation version identifiers;
- modality and reasoning category, not hidden reasoning content;
- input, cached-input, output, and billable token counts;
- provider/tool charges and estimated total cost in integer micro-units;
- latency, timeout, retry count, cache hit, and safe error category;
- schema-validation and grounding result;
- user accepted, edited, discarded, or fell back to manual completion; and
- whether the accepted result led to the intended workflow outcome.

Do not record raw prompts, model responses, customer text, evidence, images,
private URLs, tokens, or tool payloads in analytics. Evaluation examples are
synthetic or separately consented and sanitized.

```text
assist acceptance rate = accepted or edited useful results / completed assists
cost per accepted assist = total assist cost / accepted or edited useful results
manual fallback rate = manual completions after assist failure / assist requests
```

Model selection is evaluated by quality, latency, and cost per accepted outcome,
not invocation volume.

## Operational and reliability signals

Cloud/application monitoring must expose at minimum:

- request count, duration percentiles, and error rate by bounded route group;
- liveness/readiness failure and instance start behavior;
- PostgreSQL connection use, transaction failures, and migration compatibility;
- oldest outbox job age, claim latency, retry volume, expired leases, and dead jobs;
- webhook receipt-to-processing lag, signature failures, duplicate rate, and
  reconciliation mismatches;
- object upload validation, quarantine, document-rendering, and signed-access
  failures;
- notification acceptance, delivery, bounce, and terminal failure categories;
- backup freshness and restoration-test outcome; and
- analytics delivery failures and dropped-event count.

Metrics use bounded labels. Tenant IDs, project IDs, URLs, exception messages,
and arbitrary user input must never become metric labels because they leak data
and create unbounded cardinality and cost.

Initial service objectives and alert thresholds are established with production
deployment rather than invented before traffic exists. Alerts must be
actionable for the founder and include a runbook link.

## Privacy, consent, and prohibited data

Routine analytics must exclude:

- names, email addresses, phone numbers, postal or job-site addresses;
- project titles, descriptions, acceptance criteria, messages, and comments;
- filenames, object keys, evidence contents, image data, and signed URLs;
- invitation links, verification codes, session identifiers, IP addresses in
  product analytics, and authentication secrets;
- raw card/bank credentials, processor client secrets, and unrestricted Stripe
  payloads;
- invoice descriptions, tax details, and exact payment amounts in product events;
- raw AI prompts, responses, tool arguments, or retrieved excerpts; and
- support conversations and identifiable research responses.

Essential server-side measurement for security, reliability, billing, and
product operation is documented separately from optional marketing analytics.
Before adding cross-site advertising, session replay, fingerprinting, or a
nonessential client tracker, Stagenum must complete a consent, privacy-policy,
subprocessor, and legal review. Session replay is not part of the MVP.

## Access and environment isolation

- Production analytics is accessible only to the founder/authorized operators
  for documented product, financial, security, or operational purposes.
- Security telemetry has a narrower access path than ordinary product reports.
- Staging uses synthetic data, separate keys, separate datasets, and separate
  dashboards. Local/test events are disabled or sent to a disposable sink.
- Analytics exports are minimized, access-controlled, time-bounded, and deleted
  when the analysis is complete.
- Provider-facing analytics, if introduced, are computed only from that
  provider's authorized records and are not benchmarked against identifiable
  businesses.

## Retention and deletion

These defaults align with the
[MVP security and privacy baseline](../security/mvp-security-privacy-baseline.md):

| Data | Initial retention |
| --- | --- |
| Routine operational logs | 30 days searchable |
| Security/authentication telemetry | 90 days searchable; up to one year only for documented high-risk signals or an active incident |
| Raw pseudonymous product events | 90 days |
| Aggregated non-identifying product metrics | Up to 24 months while actively used for product decisions |
| AI request/cost metadata without content | 90 days raw; aggregated cost/quality results up to 24 months |
| Financial reporting | Derived from retained authoritative records under their seven-year U.S.-first baseline, pending counsel review |

Deletion and account-closure workflows remove or disassociate applicable raw
analytics keys. Aggregates may remain only when they cannot reasonably identify
or be rejoined to a person, business, or project. Provider retention settings do
not shorten mandatory security or financial retention without a documented
policy basis.

## Initial dashboards

1. **Activation:** account/business creation, first project, first invitation,
   and verified client access by weekly cohort.
2. **Core workflow:** submission, review, decision, invoice, payment, and receipt
   funnel with median transition times.
3. **Revenue and cost:** payment volume, beta-waived fee, charged fee, refunds,
   processor cost, infrastructure cost, and contribution margin from
   authoritative sources.
4. **Reliability:** availability, latency, errors, webhook lag, outbox health,
   storage/document failures, and notification delivery.
5. **AI assistance:** requests, acceptance/edit/discard, validation, latency,
   token/cache/tool cost, and cost per accepted result once enabled.
6. **Privacy and security:** authorization denials, rate limits, verification
   abuse, suspicious object access, export/support actions, and retention-job
   health, available only to the security owner.

## Implementation sequence and follow-up issues

1. Add a typed, provider-neutral analytics port and versioned event schemas.
2. Implement a server-side analytics outbox adapter with idempotent delivery and
   an explicit no-op local/test sink.
3. Configure GCP operational metrics, structured logs, dashboards, budgets, and
   founder-actionable alerts without high-cardinality labels.
4. Select a product-analytics sink only after comparing privacy controls,
   deletion support, data residency, exportability, pricing, and vendor lock-in.
5. Implement the approved MVP funnel events and reconciliation tests proving
   that analytics counts match authoritative records within a known tolerance.
6. Add privacy tests that reject prohibited fields and scan event payloads,
   logs, fixtures, and analytics configuration.
7. Add fee-waiver and financial reporting projections sourced from immutable
   ledger entries.
8. Add AI cost/quality instrumentation with the first approved AI workflow,
   not before it exists.
9. Document dashboard ownership, alert runbooks, retention jobs, deletion
   propagation, access review, and a quarterly event-value review.

## Acceptance checks

- Every event has a schema, version, owner, purpose, retention rule, and test.
- Consequential completion events cannot be emitted before their transaction
  commits.
- Duplicate commands, jobs, and webhooks do not inflate outcome metrics.
- Analytics failure cannot fail or falsify the originating business operation.
- Exact financial reports reconcile to immutable payment and fee entries.
- Restricted values are absent from events, labels, logs, dashboards, and test
  fixtures.
- Staging and production data cannot be joined or queried through shared keys.
- Dashboards show counts and definitions, not unexplained percentages.
- Metrics that do not support a current decision are removed rather than kept
  indefinitely.

## Related documents

- [Initial system architecture](initial-system-architecture.md)
- [Production domain model](production-domain-model.md)
- [Production runtime and deployment ADR](../adr/0009-production-runtime-and-deployment.md)
- [Agent-assisted workflows ADR](../adr/0010-agent-assisted-workflows.md)
- [MVP security, privacy, and data-retention baseline](../security/mvp-security-privacy-baseline.md)
- [Threat model, version 1](../security/threat-model-v1.md)
- [Invoice and payment states](../product/invoice-payment-states.md)

