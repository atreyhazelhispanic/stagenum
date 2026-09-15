# Submission Withdrawal

**Status:** Draft

**Last updated:** 2026-09-13

## Objective

Let a provider stop the review of a mistaken, incomplete, or outdated submission
without deleting history or creating uncertainty about whether the client can
still act on it.

## Decision

A provider may withdraw a submission while it is **Awaiting review**, including
after the client has opened it, as long as no approval or request for changes has
been recorded.

Withdrawal:

- immediately ends the decision opportunity for that submission;
- requires a client-visible explanation from the provider;
- preserves the submitted snapshot and prior activity;
- notifies the client;
- invalidates pending approval and requested-changes actions for that revision;
- does not alter the agreed stage scope, amount, or schedule; and
- does not itself create a new submission.

Once a client decision is recorded, the provider cannot withdraw that submission.
A mistaken approval or an already-issued invoice requires a separate corrective
workflow.

## Why withdrawal remains available after viewing

Opening a review does not mean the client has made a decision. Preventing
withdrawal after a simple view would pressure providers to leave known mistakes
in front of the client or resolve them outside StagePaid.

The client is protected by immediate notice, a visible explanation, and a
preserved record. The provider is protected from an outdated submission being
approved after recognizing a problem.

## Provider-facing flow

### 1. Start withdrawal

The provider selects:

> **Withdraw submission**

The action is available only while the submission is awaiting a client decision.
Selecting it opens a confirmation form and does not immediately withdraw the
submission.

### 2. Explain the withdrawal

#### Heading

> Withdraw **[stage name]**, revision **[revision number]**?

#### Prompt

> Tell **[client name]** why this submission is no longer ready for review.

#### Field label

> Reason for withdrawal

The explanation is required and client-visible. Example reasons may help the
provider write a useful message, but StagePaid should not reduce the explanation
to a private status code.

Suggested reasons include:

- More work is needed
- Evidence or deliverable is incorrect
- Submission was sent by mistake
- Scope or requirements need clarification
- Other

The provider may choose a suggested reason and adds a short explanation in their
own words.

### 3. Confirm the effect

The confirmation displays:

- project and stage;
- submission revision;
- whether the client has already viewed it;
- the provider's explanation; and
- the effect of withdrawal.

#### Confirmation

> **[client name]** will no longer be able to approve or request changes on this
> submission. The submission and your explanation will remain in the project
> history.

#### Actions

- Primary: **Withdraw submission**
- Secondary: **Continue editing**
- Tertiary: **Cancel**

### 4. Show a receipt

After withdrawal, the provider sees:

- **Withdrawn** status;
- project, stage, and submission revision;
- the explanation sent to the client;
- withdrawal date and time;
- whether the client had viewed the submission; and
- a clear action to prepare a new revision when appropriate.

## Client experience

StagePaid notifies the client promptly that the provider withdrew the submission.
The message identifies the provider, project, stage, revision, and explanation,
but does not embed sensitive evidence.

If the client is currently reviewing when withdrawal wins the state transition,
their next attempted decision is stopped safely. The page changes to:

> **Submission withdrawn**
>
> **[provider name]** withdrew revision **[revision number]** and it is no longer
> available for approval or changes.

The client can see the provider's explanation and the time of withdrawal. If a
new revision is later submitted, the client receives a new review notification.

## State effects

Withdrawal changes the submission from **Awaiting review** to **Withdrawn**.

A withdrawn submission:

- cannot be approved;
- cannot receive a request for changes;
- cannot become invoice-eligible;
- cannot be edited or reactivated;
- remains visible in history; and
- may be followed by a new submission revision.

The stage itself may return to an editable working state so the provider can
correct the work or evidence. The exact internal stage-state model will be
defined with the broader project lifecycle.

## Resubmission after withdrawal

The provider prepares and submits a new immutable revision. StagePaid links the
new revision to the withdrawn one and may carry forward reusable stage content,
but it does not overwrite the withdrawn snapshot.

The client receives a new invitation or notification tied to the new revision.
Opening an older review link shows the withdrawal state and directs the client to
the current submission when authorized.

## Concurrency rule

Withdrawal and client decisions follow a first-durable-event-wins rule:

- If withdrawal is recorded first, later approval or requested-changes attempts
  fail and show **Withdrawn**.
- If approval is recorded first, withdrawal fails and shows **Approved**.
- If a request for changes is recorded first, withdrawal fails and shows
  **Changes requested**.

The result is determined by the system's durable record, not by which person
clicked first or whose screen updated first. Every retry returns the recorded
result and cannot create a contradictory event.

## Recorded withdrawal event

The event includes at least:

- immutable event identifier;
- project and stage identifiers;
- withdrawn submission revision identifier;
- provider identity;
- selected reason category;
- complete client-visible explanation;
- whether a view had been recorded before withdrawal;
- withdrawal timestamp; and
- resulting stage and submission states.

The provider cannot edit the recorded explanation after withdrawal. A correction
creates a new visible event.

## Failure behavior

- The interface does not show success until withdrawal is durably recorded.
- Repeated confirmation produces one withdrawal event.
- A failed attempt preserves the provider's explanation when safe.
- If a client decision wins concurrently, the provider sees that decision and
  the withdrawal is not recorded.
- Notification failure does not reverse withdrawal; StagePaid retains a
  recoverable delivery state and retries safely.

## Customer-service requirements

- The client receives a prompt, plain-language explanation.
- The provider sees whether the submission had been viewed before confirming.
- Withdrawal language does not imply client fault.
- Old links explain the current state instead of showing a generic error.
- A new revision is clearly distinguishable from the withdrawn one.
- Both parties retain access to the shared history appropriate to their role.

## MVP boundary

### Included

- Provider withdrawal before a client decision
- Withdrawal after viewing but before a decision
- Required client-visible explanation
- Suggested reason categories
- Explicit confirmation
- Durable withdrawal receipt and activity event
- Prompt client notification
- First-durable-event-wins concurrency behavior
- Resubmission as a new revision

### Deferred

- Undoing withdrawal or reactivating the same revision
- Withdrawing an approval
- Using submission withdrawal to correct or void an issued invoice
- Client-initiated submission withdrawal
- Scheduled or automatic withdrawal
- Bulk withdrawal
- Formal cancellation of an entire stage or project

## MVP acceptance criteria

- Only the provider can initiate withdrawal.
- A provider can withdraw an awaiting submission before or after it is viewed.
- Withdrawal requires a non-empty client-visible explanation.
- The provider sees whether the client has viewed the submission.
- Withdrawal records exactly one durable event.
- The client can no longer decide on the withdrawn revision.
- The client is notified and can see the reason and timestamp.
- The original snapshot and activity remain unchanged in history.
- A new submission creates a new linked revision.
- Concurrent withdrawal and decision attempts result in one authoritative state.
- An approved or changes-requested submission cannot be withdrawn.

## Remaining decisions

1. Which event qualifies as “viewed” for provider-facing status?
2. How long should StagePaid retry a failed withdrawal notification?
3. What working state should the stage enter after withdrawal?
4. What corrective workflow handles a mistaken approval?
5. How is an entire stage or project cancelled?
