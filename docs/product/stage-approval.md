# Stage Approval

**Status:** Draft

**Last updated:** 2026-09-13

## Objective

Make approval a clear, intentional client decision tied to a specific submission
without overstating its legal effect or confusing it with invoicing or payment.

## Decision

A client approves a specific, fixed submission revision for one project stage.
Approval records that the client reviewed the submission and accepted it as
completing the described stage for StagePaid workflow purposes.

Approval:

- applies only to the identified stage and submission revision;
- is an explicit action, never inferred from viewing, silence, or inactivity;
- records the client identity, timestamp, stage amount, and submitted revision;
- completes the review state for that submission;
- automatically prepares one draft invoice for provider review; and
- remains visible in the shared project history.

Approval does not, by itself:

- record that an invoice was issued;
- record or initiate payment;
- modify the agreed scope, stage amount, or schedule;
- approve a later submission or a different stage;
- operate as a waiver of unrelated claims or contract rights;
- constitute a formal electronic signature unless StagePaid later implements a
  compliant, explicitly presented signature workflow; or
- make StagePaid a party to or arbiter of the underlying agreement.

## Client-facing review action

The primary action is:

> **Approve stage**

The action remains available only while the submitted revision is awaiting a
decision and the client has a valid verified session.

Selecting the action opens a confirmation step. It does not immediately record
approval.

## Recommended confirmation copy

### Heading

> Approve **[stage name]**?

### Summary

> You are approving revision **[revision number]** submitted by **[provider
> name]** for **[stage amount]**.

### Acknowledgement

> By approving, you confirm that you reviewed this submission and accept it as
> completing the stage described above. StagePaid will prepare a draft invoice
> for **[provider name]** to review. This does not send an invoice or record
> payment.

### Actions

- Primary: **Approve stage**
- Secondary: **Go back**

The confirmation should display the stage name, revision, provider, and amount
as structured content rather than relying only on prose.

## Why approval prepares a draft

Preparing the draft preserves momentum without taking the provider's authority
to review and issue the invoice. The complete decision is documented in [Invoice
Trigger](invoice-trigger.md).

## Approval receipt

After approval, the client sees a receipt containing:

- provider and project;
- stage name;
- approved submission revision;
- stage amount shown at confirmation;
- confirmed client display name;
- approval date and time;
- current billing status; and
- a reference identifier suitable for support.

Both parties receive a notification and can return to the same receipt from the
project history. Notification email should summarize the decision without
including sensitive evidence.

## Recorded approval event

The approval event includes at least:

- immutable event identifier;
- project and stage identifiers;
- submission revision identifier;
- provider and client identifiers;
- client-confirmed display name as it appeared at approval;
- invited client email identity;
- stage amount and currency presented at approval;
- acknowledgement version presented to the client;
- decision timestamp; and
- resulting review state.

Security telemetry may support investigation but is governed separately and is
not automatically part of the client-visible receipt.

## Changes after approval

The provider cannot edit the approved submission snapshot. New or corrected work
requires a new recorded revision or a separately agreed scope change.

Neither party can silently delete or rewrite an approval event. If an approval
was made by mistake, StagePaid should provide a later corrective workflow that
records what changed, who requested it, and why while preserving the original
event.

The exact corrective workflow is deferred until scope-change and invoice-state
behavior are defined.

## Failure and concurrency behavior

- Repeated submission of the same confirmation must not create duplicate
  approvals.
- If the provider withdraws or supersedes the submission before confirmation is
  recorded, approval must fail safely and explain that the review changed. See
  [Submission Withdrawal](submission-withdrawal.md).
- If another valid decision has already been recorded, StagePaid shows the
  resulting current state instead of overwriting it.
- A network or service failure must not show success until the approval is
  durably recorded.
- Retrying after an uncertain response must return the original result rather
  than create a second approval.

## Accessibility and comprehension

- The approval consequence must be conveyed in text, not color alone.
- The confirmation supports keyboard and assistive-technology use.
- The amount and currency use an unambiguous locale-appropriate format.
- The primary and secondary actions are visually and verbally distinct.
- The interface avoids legal jargon and does not pressure the client to approve.
- A client can return to the evidence before confirming without losing review
  context.

## MVP acceptance criteria

- Approval always refers to one stage and one immutable submission revision.
- The client sees the stage, provider, revision, and amount before confirming.
- Selecting **Approve stage** first opens a confirmation step.
- The client receives the recommended acknowledgement or a reviewed replacement.
- Approval requires a valid verified client session.
- Viewing, link opening, elapsed time, and inactivity never create approval.
- A successful approval produces one durable event and a client-visible receipt.
- The approved snapshot cannot be edited in place.
- Approval, invoice, and payment states remain distinct.
- Errors and concurrent state changes cannot produce ambiguous or duplicate
  approval events.

## Remaining decisions

1. What corrective workflow follows a mistaken or mutually withdrawn approval?
2. How are amount changes presented when an approved scope change affects the
   stage?
