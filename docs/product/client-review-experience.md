# Client Review Experience

**Status:** Draft

**Last updated:** 2026-09-13

## Objective

Give a client enough context and confidence to review a submitted stage, approve
it, or request changes without learning a project-management system or
creating an account.

The experience should feel like professional customer service: the provider has
organized the relevant information, explained what needs attention, and made the
next step easy.

## Recommended access model

Clients receive an email containing a secure review link. On first access from a
new browser or device, the client verifies with a one-time code sent to the
invited email address. Successful verification establishes a limited,
time-bound session; no password or permanent account is required.

This is passwordless access, not anonymous access. Stagenum associates the
review with the invited email address and a client-confirmed display name. The
complete product decision is documented in [Client Access](client-access.md).

A client account may become optional for people managing multiple projects, but
it is not required for the MVP review flow.

## Entry points

A client may enter the experience from:

- the original stage-review email;
- a reminder email;
- a provider-resend action; or
- a later notification that a requested revision is ready for review.

Each message should identify the provider, project, stage, and requested action
before the client follows the link.

## Review flow

### 1. Orient the client

The first screen answers five questions immediately:

1. Who is requesting my review?
2. Which project and stage am I reviewing?
3. What was agreed for this stage?
4. What has the provider submitted as complete?
5. What amount will become eligible for invoicing if I approve?

The page should show the provider's business identity, project name, stage name,
submission date, current status, and stage amount before presenting an action.

### 2. Present the submitted work

The review page keeps evidence in the context of the stage rather than presenting
an unstructured attachment list. It may include:

- the stage description and acceptance criteria;
- the provider's completion summary;
- photos with captions;
- files and deliverable links;
- checklist results;
- approved scope changes; and
- relevant prior requested changes and responses.

The client reviews a fixed submission snapshot. If the provider changes the work
after submission, Stagenum creates a new revision rather than silently changing
what the client was asked to approve.

### 3. Ask for one explicit decision

The primary actions are:

- **Approve stage**
- **Request changes**

The interface should explain that approval confirms the submitted stage is
accepted for operational workflow purposes and prepares a draft invoice for the
provider to review. It does not issue the invoice, record payment, make an
unsupported claim that the action is a legal signature, or waive rights. The
complete approval and invoice decisions are documented in [Stage
Approval](stage-approval.md) and [Invoice Trigger](invoice-trigger.md).

### 4. Confirm the decision

#### Approval

Before recording approval, Stagenum shows a concise confirmation containing:

- project and stage;
- submitted revision;
- provider;
- stage amount; and
- the effect of approval.

The client actively confirms rather than approving through an accidental single
tap. Stagenum then displays a receipt and sends confirmation to both parties.

#### Request changes

The client provides a required message explaining what needs attention so the
provider knows how to respond. The prompt should encourage the client to relate
the request to the agreed scope or acceptance criteria. The client may add
optional evidence-specific notes within the Change Request; standalone comment
threads and complex annotations are deferred. See [Evidence
Feedback](evidence-feedback.md).

If the requested work appears to expand the agreed scope rather than correct the
submitted work, Stagenum should identify it as a potential scope change for the
provider to review—not silently treat it as an included revision. The complete
decision is documented in [Requested Changes](requested-changes.md).

Stagenum confirms that the request was sent and shows what will happen next. The
stage returns to the provider without becoming invoice-eligible.

### 5. Preserve a shared record

Both parties can later see:

- which submission was reviewed;
- the decision;
- the decision timestamp;
- the identity associated with the action;
- any requested-change message; and
- subsequent resubmissions and decisions.

Internal security telemetry should be retained according to a documented privacy
and retention policy, not exposed indiscriminately in the ordinary project view.

## Experience states

- **Awaiting review:** A submission is available and no decision has been made.
- **Changes requested:** The client has returned the stage with an explanatory
  message.
- **Resubmitted:** The provider has submitted a new revision for review.
- **Approved:** The client approved a specific submission snapshot.
- **Superseded:** A newer submission replaced this version before a decision.
- **Access expired or revoked:** The link cannot establish a review session and
  the client can request a new one.

Payment status is separate from review status. An approved stage may still be
uninvoiced or have an invoice that is unpaid, partially paid, paid, overpaid,
overdue, void, or replaced. A refund is a financial event that may change the
balance; it is not a replacement invoice status. See [Invoice and Payment
States](invoice-payment-states.md).

## Customer-service details

- Use the provider's recognizable business name and reply/contact route.
- Explain why the client received each notification.
- Show progress through the overall project without overwhelming the review.
- Preserve the client's requested-change message if submission fails.
- Make expired-link recovery self-service where it can be done safely.
- Meet accessible color, keyboard, screen-reader, and touch-target expectations.
- Make support and disagreement paths visible without presenting Stagenum as
  the arbiter of the underlying contract.

## Provider controls

The provider can:

- preview the client experience before submitting;
- choose the invited client's email address;
- add a personal submission message;
- submit a fixed revision for review;
- see delivery and review status;
- send a reminder or replace an expired link;
- withdraw a submission before a decision—even after it has been viewed—with a
  client-visible explanation and recorded event; and
- respond to requested changes and resubmit.

The provider cannot edit an awaiting-review snapshot in place, approve on the
client's behalf, or erase an approval or requested-change event from the shared
history.

## MVP boundary

### Included

- Email invitation and passwordless stage access
- Responsive client review page
- Stage scope, amount, acceptance criteria, summary, and evidence
- Fixed submission revisions
- Explicit approval with confirmation
- Request changes with a required explanatory message
- Confirmation receipts for both parties
- Basic delivery, viewed, and decision states
- Link expiration, revocation, and resend
- Shared review history

### Deferred

- Permanent client accounts and portfolio dashboards
- Multiple reviewers or sequential approval chains
- Real-time chat
- Standalone comment threads, in-document markup, and complex annotations
- Formal electronic-signature claims
- Dispute resolution or adjudication
- Automated acceptance caused only by client inactivity
- Industry-specific approval certificates

## Success signals

- A first-time client can reach a decision without assistance.
- Clients understand what they are approving and the amount associated with it.
- Most submitted stages receive a decision without clarification outside
  Stagenum.
- Requested changes contain enough detail for the provider to act.
- Providers trust the review history enough to use it as their project record.

## Related decisions

The withdrawal behavior is documented in [Submission
Withdrawal](submission-withdrawal.md).
