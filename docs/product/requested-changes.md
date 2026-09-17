# Requested Changes

**Status:** Draft

**Last updated:** 2026-09-13

## Objective

Help a client explain why a submitted stage is not ready for approval and give
the provider enough context to respond without moving the conversation to email,
text messages, or another system.

The experience must distinguish work needed to satisfy the agreed stage from new
or expanded work that may affect scope, price, or schedule.

## Decision

The client action is:

> **Request changes**

The client must include a message explaining what needs attention. Sending the
request returns the stage to the provider and ends the current review without
approving the submission or making the stage eligible for billing.

A request for changes does not itself modify the agreed scope, stage amount,
schedule, or acceptance criteria.

## Client-facing flow

### 1. Start the request

The client selects **Request changes** while reviewing a fixed submission
revision. The action opens a dedicated form and does not immediately change the
stage state.

### 2. Explain what needs attention

#### Heading

> Request changes to **[stage name]**

#### Prompt

> Tell **[provider name]** what needs attention before you can approve this
> stage.

#### Guidance

> Describe how the submitted work differs from the agreed stage or acceptance
> criteria. If you are asking for new or additional work, **[provider name]** may
> respond with a scope change that affects the price or schedule.

#### Field label

> What needs to change?

The message is required. Stagenum should encourage actionable detail without
forcing arbitrary length or requiring the client to use contractual language.

The client may also add optional notes linked to specific submitted evidence.
See [Evidence Feedback](evidence-feedback.md).

### 3. Confirm before sending

The form presents:

- the project and stage;
- the submission revision being reviewed;
- the client's complete message; and
- the effect of sending the request.

#### Confirmation

> This will return the stage to **[provider name]** for a response. It will not
> approve the stage or change the agreed price or scope.

#### Actions

- Primary: **Send request**
- Secondary: **Continue editing**
- Tertiary: **Cancel**

### 4. Show a receipt

After the request is recorded, the client sees:

- **Changes requested** status;
- the message as sent;
- project, stage, and submission revision;
- date and time;
- the expected next step; and
- a reference identifier suitable for support.

Both parties receive a notification. The notification should provide enough
context to understand the event without including sensitive project evidence.

## Classifying the request

The client does not need to decide whether a request is within the agreed scope.
The provider reviews the message and chooses an appropriate response.

### Within-scope correction

The provider acknowledges the request, updates the work, and submits a new fixed
revision. The new submission links to the client's request and explains how it
was addressed.

### Potential scope change

If the request appears to add or alter work beyond the agreed stage, the provider
may propose a scope change. That proposal must clearly describe any effect on:

- deliverables or acceptance criteria;
- stage or project price;
- schedule; and
- dependent stages.

The existing agreement remains in effect until the client explicitly accepts the
scope change through a separate workflow. Neither the client's original message
nor the provider's classification silently changes the agreement.

### Clarification needed

If the provider cannot act on the request, the provider may ask for clarification
without creating a new submission. The conversation remains attached to the
request so both parties can understand the outcome later.

## Provider response

The provider can:

- acknowledge and address the requested changes;
- ask a clarifying question;
- identify a potential scope change;
- propose a separate scope change.

The provider cannot rewrite the client's message, mark the stage approved, or
erase the request from the shared history.

## Resubmission

When the provider is ready, Stagenum creates a new immutable submission revision
containing:

- the updated evidence and deliverables;
- a response summarizing what changed;
- a link to the request that prompted the revision; and
- any accepted scope changes that affect the stage.

The stage returns to **Awaiting review**, and the client receives a new review
notification. Earlier submissions, messages, and decisions remain available in
the stage history.

## State effects

Sending a request for changes:

- changes the review state from **Awaiting review** to **Changes requested**;
- ends the decision opportunity for that submission revision;
- prevents that submission from being approved later;
- prevents the stage from advancing to billing based on that submission; and
- assigns the next response to the provider.

A later resubmission creates a new revision and returns the review state to
**Awaiting review**.

## Recorded event

The requested-changes event includes at least:

- immutable event identifier;
- project and stage identifiers;
- reviewed submission revision identifier;
- provider and client identifiers;
- client-confirmed display name as it appeared when sent;
- invited client email identity;
- complete requested-change message;
- decision timestamp; and
- resulting review state.

The system retains the exact message presented to the provider. Later edits or
clarifications create new events rather than rewriting the original request.

## Failure and concurrency behavior

- Repeated submission of the same request must not create duplicate events.
- If the provider withdraws or supersedes the submission before the request is
  recorded, sending must fail safely and explain that the review changed.
- If another decision was already recorded, Stagenum shows the current result
  instead of overwriting it.
- The client does not see a success state until the request is durably recorded.
- A failed form submission preserves the client's message locally when it is safe
  to do so.

## Accessibility and customer service

- The form uses plain language and does not frame feedback as a dispute.
- The client can return to the submission evidence without losing their draft.
- Validation explains how to correct a problem and preserves entered text.
- The form supports keyboard, screen-reader, and touch interaction.
- The provider's recognizable name and contact route remain visible.
- The experience explains what happens after the request is sent.
- The interface does not pressure the client to approve instead of providing
  honest feedback.

## MVP boundary

### Included

- One required overall message per requested-changes decision
- Optional notes linked to specific submitted evidence
- Confirmation before sending
- Durable receipt for both parties
- Provider acknowledgement, clarification, and response
- Linked resubmission history
- Identification of a potential scope change
- Clear separation between requested changes and agreed scope changes

### Deferred

- Standalone comment threads and free-form evidence annotations
- Real-time chat
- Drawing and markup tools
- Multiple simultaneous reviewers
- Automated classification of requests
- A complete scope-change proposal and acceptance workflow
- Platform adjudication of whether work is in scope

## MVP acceptance criteria

- A client cannot request changes without entering a non-empty message.
- The client sees the stage and submission revision before sending.
- The confirmation explains that the request does not approve the stage or alter
  agreed scope or price.
- Sending records exactly one durable event and changes the state to **Changes
  requested**.
- The original submission cannot later be approved after changes are requested.
- The provider can respond, clarify, or identify a potential scope change.
- A resubmission creates a new revision linked to the original request.
- Neither party can silently edit or delete the original message.
- Requested changes, scope changes, approval, invoicing, and payment remain
  distinct concepts and states.

## Remaining decisions

1. What is the complete proposal and acceptance workflow for a scope change?
2. Can a client append clarification before the provider responds?
3. Should the provider be required to acknowledge every request explicitly?
4. Which notification details are appropriate for email?
