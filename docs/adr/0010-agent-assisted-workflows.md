# ADR-010: Use bounded, human-approved agent assistance

**Status:** Proposed

**Date:** 2026-09-24

**Decision owners:** Stagenum maintainers

## Context

Stagenum may eventually use AI assistance to reduce the effort of turning
provider-entered notes and evidence into a usable draft. Examples include
suggesting a concise stage summary, extracting candidate fields from a receipt,
or describing visible evidence for a provider to review.

Those are assistive tasks. They are fundamentally different from authoritative
product behavior: authorization, approval, Change Requests, invoices, payment
state, refunds, access grants, and financial records must remain deterministic,
auditable application behavior. A language model can be useful when language,
images, or ambiguity make a deterministic rule brittle; it is not a substitute
for a transaction, policy, or database invariant.

Agent frameworks can make it easy to pass whole records, uploaded content, and
tools between multiple model calls. That convenience would create unnecessary
cost, privacy exposure, prompt-injection paths, and difficult-to-explain
outcomes for a small product. Stagenum needs a design that gives a solo founder
clear control over data, cost, quality, and human responsibility.

## Decision

When AI assistance is introduced, Stagenum will begin with **one bounded,
server-side, provider-initiated assistive workflow at a time**. Each workflow
has a narrow typed input contract, a fixed purpose, a token and cost budget, a
validated structured output, an evaluation set, and explicit human approval
before its result can affect customer-visible content.

The first implementation will use a single model call through a provider-neutral
application port. It will not use a general autonomous agent, unrestricted
tools, broad retrieval, agent-to-agent handoffs, or authority to write business
records. The application remains the authority for all state transitions and
external side effects.

A model may produce a suggestion. It may not independently approve work, change
a project, issue or correct an invoice, initiate/refund a payment, grant access,
send a client message, access unrelated records, or make a legal, tax, safety,
or fraud determination.

## Decision details

### Start with deterministic code

A workflow uses ordinary code when its correct result can be expressed as a
rule, query, calculation, state transition, fixed template, validation schema,
or bounded lookup. This includes permissions, money, lifecycle eligibility,
idempotency, retention, signatures, and all writes to durable business records.

An assistive model is justified only when all of these are true:

1. the input is naturally unstructured or perceptual, such as provider prose,
   an image, or a document;
2. the desired result is a non-authoritative draft, classification, extraction,
   or explanation rather than a binding decision;
3. a deterministic alternative would be materially more brittle or burdensome;
4. a human can understand and accept, edit, or discard the result; and
5. a small representative evaluation set shows a useful quality/cost outcome.

If any condition fails, use deterministic application code or defer the feature.

### First workflow boundary

The first candidate is a provider-requested **evidence-to-stage-summary draft**.
It may turn provider-selected notes and evidence descriptions into a concise
draft for the provider's own review. It does not submit a stage, notify a
client, alter a timeline, or infer approval.

The application use case owns authorization and records an assist request. A
context builder retrieves only the selected, already-authorized inputs and
converts them to a small typed payload. An AI adapter receives that payload and
returns a typed suggestion. The provider sees source references, warnings, and
the generated draft; only an explicit provider command can save an edited draft
or use it in a later workflow.

```text
provider command -> authorization -> context builder -> AI adapter
                                                |             |
                                                |             v
                                                |     validated draft only
                                                v
                                      request/audit metadata

provider review/edit/accept -> ordinary application command -> durable record
```

### Workflow routing and model choice

The model does not choose which model or capability runs. Deterministic
application code routes an explicit product action to a reviewed workflow
configuration:

```text
user action/prompt -> workflow router -> authorized context builder
                           |                       |
                           v                       v
                 pinned model policy -> AI adapter -> typed candidate result
                                                        |
                                                        v
                                               validation and human review
```

For example, **Draft invoice details**, **Help write a client message**, and
**Describe selected evidence** are separate workflows. Each has its own input
allowlist, schema, model/modality requirement, prompt version, token budget,
evaluation set, and fallback. A free-form prompt may supply content inside the
selected workflow; it does not grant permission to switch workflows, retrieve
more records, select a more expensive model, or gain additional tools.

The router may choose among preapproved configurations using deterministic facts
such as workflow type, supported input modality, input size, language, risk tier,
latency target, and current budget. It does not ask one model to decide which
model should receive the customer's data. A configuration change is versioned
and evaluated before production use.

For an invoice-drafting workflow, the model may extract or suggest candidate
descriptions, quantities, dates, or category labels from authorized notes. The
application independently sources agreed amounts, currency, approval state,
fees, totals, identifiers, and payment status from authoritative records and
validates every candidate field. Nothing is issued until the provider reviews
and confirms the ordinary invoice command.

For an image-description workflow, the router selects an approved vision-capable
configuration and sends only provider-selected, authorized evidence at the
reviewed detail level. The result remains an editable description with source
provenance, not proof that work was completed or safe.

### Context is a least-privilege projection

The context builder is server-side code, not a model tool. It receives an
authorized actor, project, use-case name, and selected source identifiers. It
loads only fields on an allowlist for that purpose and provides compact,
structured facts plus bounded excerpts.

It never sends a whole project, database row, conversation history, private URL,
session/invitation value, raw payment information, ledger history, unrelated
client/provider data, or secret. Payment, access, and financial information are
not valid context for the initial workflow. Evidence bytes and document text are
separate, explicitly approved inputs with their own size, format, and privacy
review.

Long source material is handled by deterministic chunking and selection before
the model call:

1. choose only provider-selected records already visible to that actor;
2. cap each excerpt and total input size;
3. retain stable source IDs and compact facts, not full conversation copies;
4. summarize only when a prior, evaluated workflow is permitted; and
5. discard raw model context after the request unless a documented retention
   purpose requires a restricted copy.

A conversation summary is a lossy convenience, not a source of truth. It stores
clear provenance, scope, version, timestamp, and source IDs, and the application
re-fetches authoritative facts before consequential display or action.

### Untrusted content and prompt injection

Provider notes, client messages, OCR text, document text, image descriptions,
retrieved snippets, and model output are all untrusted data. They are never
concatenated into developer instructions or granted authority over tools.

The adapter keeps fixed task instructions separate from untrusted data, labels
each input as content rather than instruction, and uses strict structured output
with an allowlisted schema. The initial workflow has no tools. A later tool must
have a narrow server-implemented contract, authorization performed outside the
model, idempotency where relevant, least-privilege data access, and explicit
human confirmation for external or consequential effects.

OpenAI's current guidance similarly recommends keeping untrusted variables out
of developer messages, using structured outputs to constrain data flow, and
keeping tool approvals enabled for agent workflows. See [Safety in building
agents](https://developers.openai.com/api/docs/guides/agent-builder-safety).

### Structured result contract

Every workflow defines an explicit JSON schema owned by the application. The
initial draft contract contains only:

- `summary`: concise provider-facing text within a configured limit;
- `observations`: a bounded list of source-grounded factual statements;
- `uncertainties`: a bounded list of missing, ambiguous, or conflicting facts;
- `sourceIds`: references limited to the supplied source IDs; and
- `requiresProviderReview`: always `true` for the initial workflow.

The adapter validates the response schema, field limits, allowed source IDs,
and prohibited content before returning it. Schema validity is not proof of
truth: the provider remains responsible for factual review. Invalid, incomplete,
timed-out, refused, or over-budget output creates no business mutation and
falls back to ordinary manual drafting.

### Model selection and runtime configuration

Model selection is a per-workflow configuration, not an application-wide
default. The runtime stores the provider, pinned model identifier, reasoning
setting, input/output limits, price-table version, prompt version, and fallback
policy with the workflow configuration. It never silently changes a model for a
live workflow without evaluation evidence and review.

Use the least capable configuration that meets the evaluated quality target:

| Work type | Initial model posture | Examples |
| --- | --- | --- |
| Deterministic | No model | authorization, money, state transitions, templates, validation |
| High-volume, well-scoped | efficient/smaller model with low reasoning | classification, extraction into a fixed schema, formatting, short draft variants |
| Ambiguous, multi-source assistance | balanced model with bounded reasoning | reconciling selected evidence into a provider-reviewed summary |
| Novel, ambiguous, high-impact analysis | strongest model only behind human review | complex research or internal operator analysis; never automatic financial/access action |

At the time of this ADR, OpenAI's [model-selection guide](https://developers.openai.com/api/docs/guides/model-selection)
describes Luna as the efficient option for scoped work, Sol as a general
judgment-oriented option, and Astra as the highest-capability option for
ambiguous problems. Availability, pricing, limits, and exact identifiers change,
so implementation checks the provider's current catalog and evaluates an
explicitly pinned choice rather than hard-coding a marketing label.

### Cost and context controls

Each workflow declares a budget before implementation:

- maximum source records, input tokens, output tokens, wall-clock time, retries,
  and daily/monthly spend;
- an output schema with concise field limits and an early-stop condition;
- a cache key and retention rule, if the result is safely reusable; and
- a fallback that leaves the user able to complete the task manually.

Cache stable instructions and safe deterministic intermediate work before
caching customer-derived results. Never use caching to bypass authorization,
freshness, revocation, or a user's request for an updated draft. Batch
independent low-risk requests only when their data classification, latency, and
failure behavior permit it; never merge different tenants into one context.

Measure both raw use and product value:

```text
workflow cost = input-token cost + output-token cost + tool/provider cost
cost per successful outcome = total workflow cost / accepted useful results
```

A result is successful only when the user accepts it or a defined evaluator
scores it as useful; invocation count alone is not value.

### Retries, fallback, and records

A request has a caller-provided idempotency key and bounded lifecycle:

1. validate authorization, selected sources, budget, and input schema;
2. call the adapter once with a bounded timeout;
3. validate the structured response;
4. optionally make one schema-repair retry using only validation errors and the
   original minimal context; and
5. return a reviewed draft or a clear manual fallback.

Transient provider failure can retry through the transactional outbox only when
the user requested asynchronous assistance and the request remains authorized.
Retries do not duplicate customer-visible drafts or charges. No model retry may
cross a spend limit, time limit, or revoked access grant.

The audit record stores request ID, workflow/prompt/model configuration IDs,
source IDs, data-classification flags, timestamps, latency, token counts, cost,
validation outcome, user disposition, and safe error category. It does not
store raw prompts, evidence, customer text, tokens, secrets, private URLs, or
unredacted provider responses in routine logs or analytics.

### Evaluation before release

Each workflow has a versioned evaluation dataset built from synthetic or
consented, sanitized examples. It includes ordinary, ambiguous, incomplete,
adversarial, prompt-injection, privacy-sensitive, and refusal/failure cases.
It never uses copied production records in the repository.

The evaluation compares candidate prompts, schemas, models, reasoning settings,
and context sizes on:

- schema and validation pass rate;
- factual grounding and unsupported-claim rate;
- correct uncertainty/refusal behavior;
- human acceptance/edit/discard rate;
- prompt-injection resistance and sensitive-data disclosure rate;
- latency, input/output tokens, and cost per accepted result; and
- performance by input type and relevant user segment without collecting
  unnecessary sensitive demographics.

OpenAI recommends pinning model versions and using evals to maintain consistent
prompting behavior as models evolve. See the [API introduction](https://platform.openai.com/docs/api-reference/introduction).

### Multi-agent boundary

A separate agent is not a default unit of architecture. Multiple model calls
often duplicate instructions, summaries, and customer context, increasing cost,
latency, and privacy exposure without improving the result.

Start with one application-owned workflow and one model call. Add a second
specialist only when an evaluation shows that one clear subtask has distinct
tools, data, quality needs, or failure isolation that a single bounded call
cannot provide. Pass a typed minimal handoff—not an entire transcript—between
steps. The orchestrator remains deterministic application code, records source
provenance, enforces total workflow budget, and prevents loops or unbounded
delegation.

## Consequences

### Positive

- AI can improve an explicitly useful drafting task without becoming a hidden
  authority over money, access, or customer commitments.
- Context minimization reduces token use, accidental disclosure, and injection
  surface area.
- Typed ports keep model/provider SDKs outside domain and application rules.
- Evaluation evidence and cost-per-outcome data make model upgrades defensible.
- The design retains a simple path to a later specialist or agent workflow if
  measured value justifies it.

### Negative and tradeoffs

- Context builders, schemas, evals, and review UI add work before a feature can
  be called intelligent.
- Human review means the first assistance is not fully autonomous.
- Strict data minimization can make a draft less fluent than a model given an
  entire project history.
- Provider/model behavior, cost, and availability remain external dependencies.
- Quality measurement requires deliberate data curation and regular review.

## Alternatives considered

### No AI assistance

This remains the correct choice when deterministic UX is sufficient or research
does not demonstrate a painful drafting task. It sacrifices a possible
convenience, not product correctness.

### A general chat agent with broad project access

A conversational assistant appears flexible but would need to decide which
records to retrieve, increasing authorization, privacy, prompt-injection, and
evaluation burden. It is deferred until a narrow workflow proves value and a
separate decision establishes safe retrieval and tool boundaries.

### Autonomous agent with write tools

Autonomous writes are incompatible with Stagenum's requirements for exact
revision approval, immutable financial history, idempotency, and clear actor
attribution. They are rejected for MVP assistance.

### Multi-agent orchestration from the first feature

Specialists may eventually help with distinct tasks, but starting with them
would duplicate context and obscure failure responsibility. Evaluation evidence
must justify each additional handoff.

### Client-side model calls

Browser calls would expose provider credentials, weaken context control, and
make authorization/audit enforcement inconsistent. AI adapters remain
server-side.

## Security and privacy implications

AI adapters are external-service boundaries under the MVP security baseline.
They receive only purpose-limited, authorized, minimized context; use
environment-separated credentials; and never receive raw payment credentials,
session material, invitations, secrets, or unrestricted project histories.

Uploaded text and evidence are hostile until validated. Model output is treated
as untrusted until schema validation and human review. The model has no direct
database, Stripe, email, storage, or internal-administration access in the
initial design. Access revocation prevents subsequent requests and invalidates
pending asynchronous work before execution.

Provider terms, retention, training, regional processing, content moderation,
and deletion capabilities require a pre-launch vendor/privacy review. Do not
make assumptions about them from an SDK alone.

## Validation and enforcement

Before each agent-assisted workflow releases:

- define a typed application port and a context allowlist;
- test domain/application layers for absence of provider SDK imports;
- test tenant/project authorization and source selection before every call;
- test input/output limits, malformed output, timeout, retry, budget, fallback,
  idempotency, revocation, and audit behavior;
- run the versioned quality, privacy, and prompt-injection evaluation set;
- compare at least one lower-cost and one higher-capability configuration when
  both are plausible choices;
- review samples with a human for grounding and useful uncertainty; and
- record the model/prompt/schema/evaluation versions and cost result before
  promotion.

## Revisit triggers

Create a superseding ADR or bounded follow-up decision when:

- research does not show that the proposed workflow saves meaningful effort;
- acceptance rate, grounding, injection resistance, latency, or cost misses the
  workflow target;
- a use case needs retrieval, external tools, client access, background work,
  persistent conversation, image/document processing, or multiple specialists;
- a provider's privacy, retention, regional, price, model, or availability terms
  materially change;
- Stagenum considers using model output for an action with financial, access,
  legal, safety, or customer-commitment consequences; or
- user research or incident evidence shows the human-review boundary is unclear.

## Related decisions and documents

- [Initial system architecture](../architecture/initial-system-architecture.md)
- [Production application foundation](../development/production-foundation.md)
- [MVP threat model](../security/threat-model-v1.md)
- [MVP security, privacy, and data-retention baseline](../security/mvp-security-privacy-baseline.md)
- [ADR-001: Modular monolith](0001-modular-monolith.md)
- [ADR-002: TypeScript](0002-typescript-primary-language.md)
- [ADR-004: Persistence and migrations](0004-persistence-and-migrations.md)
- [ADR-005: Transactional outbox and jobs](0005-transactional-outbox-and-jobs.md)
