# ADR-007: Treat verified Stripe webhooks as payment authority

**Status:** Accepted

**Date:** 2026-09-16

**Decision owners:** Stagenum maintainers

## Context

Stagenum clients initiate payments through Stripe, but payment processing is
asynchronous. A browser can close, lose connectivity, display stale state, or
receive an API response before the final payment outcome. Some payment methods
remain in processing for an extended period, and later events such as refunds,
reversals, disputes, and chargebacks can change the financial position.

Neither a client callback nor a successful request to create or confirm a
PaymentIntent proves that Stagenum has durably recorded the final result.
Polling Stripe from the client is also not a reliable foundation for ledger
updates.

Stripe webhook deliveries can be duplicated, retried, and received out of
order. An endpoint must verify the signature against the exact raw request body,
respond quickly, and process financial effects idempotently. Stagenum needs a
clear boundary between Stripe's processor records and its own invoice and
ledger records.

## Decision

For Stripe-processed payments, **a verified Stripe webhook event is the normal
authority that permits Stagenum to record a processor-originated financial
transition**.

Client responses and synchronous Stripe API responses may update the payment
attempt experience, but they do not mark an invoice paid, apply money to its
balance, create a final receipt, or trigger provider fulfilment. Those business
effects occur only after the server accepts an authenticated Stripe event or an
audited reconciliation process retrieves and verifies equivalent Stripe state.

Stripe is authoritative for what occurred in Stripe. Stagenum's append-only
financial ledger is authoritative for how verified processor activity is
represented and applied to Stagenum invoices, fees, refunds, disputes, and
provider balances.

## Decision details

### Separation of states

Stagenum maintains distinct concepts:

- **Payment attempt state** describes the customer's current interaction, such
  as awaiting payment method, requiring action, processing, failed, cancelled,
  or apparently successful at the client.
- **Verified processor event** records an authenticated Stripe event or
  reconciliation observation that Stagenum accepted for processing.
- **Financial ledger event** records the immutable Stagenum interpretation of
  money collected, refunded, reversed, disputed, fee-assessed, or otherwise
  applied.
- **Invoice balance state** is derived from the issued invoice and applicable
  ledger events.

A client-facing success response may show that confirmation completed, but the
invoice remains pending processor confirmation until the verified event has
been committed to Stagenum's ledger.

### Payment initiation

The server creates or updates Stripe payment resources using authenticated
server-side API calls. The client never chooses an authoritative invoice amount,
currency, fee, recipient, connected account, or Stagenum metadata mapping.
Those values are derived from the immutable invoice and server configuration.

Each collection operation has a stable Stagenum attempt identifier. Stripe
object identifiers are stored separately and constrained to the relevant
environment, account or connected-account context, and object type.

Mutating Stripe API requests use stable, operation-specific idempotency keys.
Reusing a key for a materially different operation is prohibited. A timeout or
ambiguous response is reconciled using the same key or the known Stripe object;
it does not automatically create a second payment resource.

Only the minimum non-sensitive correlation identifiers are placed in Stripe
metadata. Metadata does not contain access tokens, private evidence, card data,
unnecessary personal information, or authoritative amounts that can replace
server records.

### Client behavior

Stripe-hosted or approved Stripe client components collect payment credentials.
Raw card details and security codes never pass through Stagenum servers, logs,
analytics, or databases.

The client may use the PaymentIntent result to provide immediate guidance:

- request another payment method after a failure;
- continue required authentication;
- display processing for a delayed method; or
- display that confirmation succeeded and Stagenum is verifying the payment.

The client cannot directly update invoice or ledger state. Refreshing,
replaying, or modifying a client request must not duplicate a charge or ledger
effect.

PaymentIntent client secrets are temporary capabilities. They are returned only
to the authorized payer over TLS, never logged or placed in URLs, and never
treated as general project authorization.

### Webhook ingress

The Stripe webhook endpoint will:

1. receive the exact raw request body over HTTPS;
2. apply a strict request-size limit;
3. verify the `Stripe-Signature` using Stripe's official server library, the
   correct endpoint secret, and an enabled timestamp tolerance;
4. identify the expected live or test environment and Stripe account context;
5. reject invalid signatures, stale signatures, malformed payloads, and unknown
   contexts without creating financial effects;
6. durably record a minimal verified event envelope or idempotently recognize a
   prior receipt; and
7. return a successful response quickly after durable acceptance, before
   performing expensive business processing.

Signature verification occurs before ordinary JSON middleware changes the raw
body. Each endpoint and environment has its own signing secret. Secret rotation
supports an intentional overlap period and is tested before the old secret is
retired.

A valid signature proves that Stripe signed the delivered bytes. It does not by
itself prove that the referenced invoice, amount, currency, account, livemode,
or lifecycle transition is valid for Stagenum; those checks still occur during
processing.

### Asynchronous processing

Accepted events are processed asynchronously using the transactional job
strategy from ADR-005. The processing transaction:

- deduplicates the Stripe event identifier within its endpoint and account
  context;
- validates the supported event type and pinned payload version;
- correlates the Stripe object with the expected Stagenum payment attempt and
  invoice;
- verifies environment, account, amount, currency, and relevant metadata;
- confirms that the observed transition is valid or records an exception for
  reconciliation;
- appends the appropriate immutable ledger event;
- updates rebuildable balance and settlement projections;
- records the project timeline and audit outcome; and
- creates outbox entries for receipts and notifications.

These writes commit atomically. A processing failure causes Stripe delivery or
internal job processing to retry without partially applying money.

### Duplicates and idempotency

Stripe may deliver the same Event more than once. Stagenum stores each accepted
Stripe event identifier with a unique database constraint so redelivery cannot
apply its effect twice.

Stripe may also produce separate Event objects concerning the same underlying
object and transition. Business-level uniqueness therefore additionally uses
the relevant Stripe object identifier, event type or transition, and Stagenum
ledger relationship. Event-ID deduplication alone is insufficient.

Receipt, email, balance, fee, and payout-related jobs use stable identifiers and
remain safe after worker retries or crashes.

### Ordering and current state

Webhook delivery order is not guaranteed. Stagenum does not compare Stripe
event creation timestamps as a universal ordering mechanism and does not assume
the most recently received event describes the latest object state.

Handlers use legal state transitions and immutable financial facts. When an
event arrives without required prior context, appears stale, or conflicts with
known state, the processor may retrieve the current Stripe object using the
server API, defer processing, or create a reconciliation exception.

A later observation never deletes an earlier accepted financial event. It adds
the refund, reversal, dispute, recovery, or corrective entry necessary to
explain the resulting balance.

### Relevant events

Stagenum subscribes only to event types required by the implemented payment
and settlement model. The exact list is configuration and evolves with enabled
Stripe products, but it will cover applicable transitions such as:

- payment processing, success, and failure;
- refunds and refund failures;
- disputes, dispute updates, and dispute closure;
- charge reversals or other balance-changing corrections;
- connected-account capability or payout state when Stagenum adopts Stripe
  Connect; and
- other processor events required to reconcile Stagenum fees and provider
  settlement.

Subscribing to an event type does not mean every event creates a ledger entry.
Each handler documents its validation, idempotency, state transition, and
financial effect.

### Refunds, disputes, and fees

A refund request accepted by Stripe is not recorded as completed merely because
the API call returned. Stagenum records the request or pending attempt, then
uses verified events or reconciliation to append the actual refund outcome.

Disputes and reversals append financial events that adjust derived balances and
provider settlement without changing the historical invoice or successful
payment record.

Stagenum's 1% application fee and any proportional fee reversal are represented
explicitly in its ledger. Stripe processing, Connect, dispute, and other fees
are recorded from authoritative Stripe balance or reporting data where the
selected integration exposes them. Stagenum does not infer a provider fee from
a hard-coded percentage when the actual amount is available from Stripe.

### Reconciliation path

Webhooks are the normal real-time authority path, but they are not the only
recovery mechanism. A scheduled reconciliation process compares Stagenum
attempts and ledger records with Stripe objects and reports.

Reconciliation may import a missing authoritative transition after:

- verifying the Stripe account and environment;
- retrieving the object through authenticated server-side APIs;
- validating amount, currency, invoice correlation, and lifecycle eligibility;
- recording the source and retrieval time;
- applying the same business-level idempotency rules as webhook processing; and
- producing an auditable exception or correction record.

Manual Dashboard observation or a support statement does not directly mutate
the ledger. An operator initiates the controlled reconciliation workflow.

### API and event versioning

The Stripe API version and event-destination version are pinned and changed
deliberately. Payloads are validated at runtime. An SDK upgrade or account-level
API change does not automatically redefine historical event interpretation.

Version changes require sandbox fixtures, replay or compatibility tests,
deployment sequencing, and verification of every subscribed event handler.
Unknown event types and unexpected payload versions are retained safely for
inspection when appropriate but do not create financial effects.

### Acknowledgement and failure behavior

The ingress endpoint returns:

- a non-success response when authentication or durable acceptance fails so
  Stripe can retry when appropriate; and
- a success response after the verified event is durably accepted, even though
  asynchronous business processing is still pending.

Internal terminal processing failures do not cause an endless Stripe delivery
loop after durable receipt. They remain visible in Stagenum's failed-job and
reconciliation tooling with alerts and controlled replay.

## Consequences

### Positive

- Payment completion does not depend on a browser remaining open.
- Verified server-to-server events provide a trustworthy boundary for Stripe
  outcomes.
- Duplicate delivery and retries cannot apply money twice when constraints and
  business idempotency are enforced.
- Client, processor, ledger, and invoice states remain explicit rather than
  collapsing into one `paid` flag.
- Out-of-order events and delayed payment methods have defined handling.
- Append-only financial entries preserve the explanation for refunds, disputes,
  reversals, and corrections.
- Reconciliation provides recovery when delivery, configuration, or processing
  fails.

### Negative and tradeoffs

- The UI may briefly show payment verification after Stripe confirmation.
- Webhook ingress, raw-body handling, secret rotation, versioning, and
  reconciliation add operational complexity.
- Stagenum must maintain mappings among invoices, attempts, PaymentIntents,
  Charges, refunds, disputes, balance activity, and account contexts.
- At-least-once and out-of-order delivery require careful state machines and
  database constraints.
- Stripe remains an external dependency whose outages can delay authoritative
  payment updates.
- Reconciliation and exception handling are required even with well-tested
  webhooks.

## Alternatives considered

### Trust the browser result

The browser can be closed, modified, replayed, or disconnected before Stagenum
records the result. It is useful for immediate presentation but cannot
authoritatively update invoices or the ledger.

### Trust the synchronous Stripe API response

The response can be ambiguous after a timeout and may represent an intermediate
state. Some payment methods complete later. Synchronous responses create or
advance attempts, while verified events establish resulting financial effects.

### Poll Stripe as the primary mechanism

Polling adds latency and API load and can still miss the correct relationship
between observations and internal processing. It remains valuable for targeted
reconciliation, not the normal authority path.

### Process the full webhook before responding

Performing ledger, document, and notification work during ingress increases
timeouts and duplicate delivery. Durable receipt followed by asynchronous,
idempotent processing gives a faster and more reliable acknowledgement path.

### Treat Stripe as Stagenum's only ledger

Stripe records processor activity but does not encode all Stagenum invoice,
agreement, external-payment, application-fee policy, and client-visible history.
Stagenum needs an internal append-only ledger linked to Stripe's authoritative
objects and events.

## Security and privacy implications

- Webhooks require HTTPS and signature verification against the exact raw body.
- Signing secrets and API keys are stored in managed secrets, separated by
  environment and account context, rotated, and never exposed to clients.
- Timestamp tolerance remains enabled, and production hosts maintain accurate
  time to reduce replay risk.
- PaymentIntent client secrets are not logged, placed in URLs, or returned to an
  actor who is not authorized to pay the associated invoice.
- Raw payment credentials never enter Stagenum systems.
- Event payloads, logs, traces, and retained diagnostic data are minimized and
  redacted according to payment and privacy requirements.
- The handler validates `livemode`, Stripe account context, object identity,
  amount, currency, and Stagenum correlation before creating financial effects.
- Operator reconciliation and replay require privileged access and produce
  audit records.
- The endpoint is rate limited and size bounded without relying on rate limiting
  as a substitute for signature verification.

## Validation and enforcement

The implementation will enforce this decision through:

- official Stripe signature-verification libraries and raw-body endpoint tests;
- Stripe CLI and sandbox tests for every subscribed event type;
- invalid, stale, wrong-secret, wrong-account, wrong-environment, malformed, and
  oversized webhook tests;
- duplicate Event and duplicate underlying-object transition tests;
- out-of-order, delayed, and missing-event scenarios;
- crash-point tests between receipt, job processing, ledger commit, and receipt
  generation;
- tests proving client and synchronous API responses cannot mark invoices paid;
- unique database constraints for processor and ledger idempotency;
- reconciliation tests that import missing facts without duplicating existing
  ledger effects;
- contract fixtures pinned to the configured Stripe API and event versions;
- monitoring for delivery failures, signature rejection, unprocessed-event age,
  handler failure, reconciliation differences, and ledger imbalance; and
- periodic comparison of Stripe reports and balance activity with Stagenum's
  ledger and provider settlement views.

## Revisit triggers

A new ADR should reconsider this decision when:

- Stagenum adds another payment processor or supports direct external payment
  imports;
- Stripe Connect account and charge architecture changes the authoritative
  account context or event topology;
- payment volume requires a dedicated event-ingestion service;
- a Stripe event-destination product provides materially different delivery or
  authentication guarantees;
- regulatory, accounting, or marketplace requirements change ledger or funds-
  flow responsibilities; or
- Stagenum introduces authorization-and-capture, recurring billing, escrow-like
  behavior, or payment methods with materially different settlement semantics.

## Related decisions and documents

- [ADR-003: Use PostgreSQL as the primary database](0003-postgresql-primary-database.md)
- [ADR-005: Use a transactional outbox and idempotent background jobs](0005-transactional-outbox-and-jobs.md)
- [Invoice and payment states](../product/invoice-payment-states.md)
- [Stage-to-payment sequence](../architecture/diagrams/stage-to-payment-sequence.mmd)
- [Initial system architecture](../architecture/initial-system-architecture.md)
- [Stripe webhook documentation](https://docs.stripe.com/webhooks)
- [Stripe payment-status guidance](https://docs.stripe.com/payments/payment-intents/verifying-status)
- GitHub issue #7: Record foundational architecture decisions
