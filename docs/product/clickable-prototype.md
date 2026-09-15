# First Clickable Prototype

**Status:** In progress

**Last updated:** 2026-09-14

## Objective

Create a repository-hosted, mobile-first prototype that makes StagePaid's core
value understandable and testable without a production backend, authentication
system, file store, or payment processor.

## Primary research question

Can a contractor and homeowner understand and complete the handoff from documented
stage work to an explicit client decision, provider-issued invoice, and recorded
payment without losing the evidence or decision context?

## Scenario

Northline Residential is completing a fictional kitchen remodel for Morgan and
Casey R. The contractor prepares the **Rough-in inspection** stage with evidence
and submits revision 1.

The homeowner sends a Change Request asking for clarification of one inspection
detail. The contractor responds with revised evidence and submits revision 2.
The homeowner approves that fixed revision. StagePaid prepares a draft invoice,
the contractor reviews and issues it, and the homeowner submits payment.

All people, businesses, projects, identifiers, dates, amounts, and evidence in
the prototype are synthetic.

## Required path

1. Provider project overview
2. Provider stage workspace and evidence review
3. Submission confirmation
4. Passwordless client review
5. Client Change Request
6. Provider response and resubmission
7. Client approval of revision 2
8. Provider invoice review and issuance
9. Client invoice and **Pay balance** flow
10. Payment receipt and updated project history

## Prototype boundaries

### Included

- Mobile-first responsive web experience
- One realistic synthetic project fixture
- Clickable happy path with one Change Request loop
- Visible stage, submission, approval, invoice, and payment relationships
- Simulated passwordless access, uploads, notifications, card payment, and ACH
  processing
- Keyboard-accessible controls and clear focus states
- A visible prototype and synthetic-data disclosure
- A reset action that restores the original fixture

### Excluded

- Production authentication or authorization
- A database or remote object storage
- Real file uploads
- Stripe API calls or payment credentials
- Email, SMS, or push delivery
- Durable multi-user state
- Production system architecture decisions

## Synthetic fixture policy

The initial fixture lives in `prototype/data/`. Bundled demonstration evidence
belongs under `prototype/public/demo/evidence/` and must be created for the
project or have documented redistribution rights.

The prototype must not contain real interview responses, contractor or client
identities, addresses, invoices, job-site photographs, credentials, or payment
information.

Interactive changes are held in browser memory. Optional local browser storage
may preserve a demonstration session, but **Reset demo** must restore the
committed fixture. The interface never implies that prototype changes were
saved to StagePaid or another person's device.

## Success criteria

- A participant can identify the current stage and next action without
  explanation.
- A participant can distinguish stage submission from client approval.
- A participant understands that a Change Request does not silently change
  scope, price, or schedule.
- A participant understands that approval prepares but does not issue an
  invoice.
- A participant can identify which submission revision was approved.
- A participant understands that **Pay balance** requests the full outstanding
  amount.
- Payment processing and successful payment are visibly distinct.
- The complete path works at narrow mobile and desktop widths.
- No interaction sends data to a production service.

## Implementation approach

The prototype is a static, repository-owned React application under
`prototype/`. Its fixture-loading boundary can later be replaced by API calls,
but prototype components and browser state do not establish the production
application architecture.

## Validation prompts

After observing a participant use the prototype, ask:

1. What did you think would happen when the provider submitted the stage?
2. What did approval mean to you?
3. What would you expect after requesting a change?
4. Which invoice amount and revision did you believe were connected?
5. Where did you hesitate or expect a different next action?
6. Which part would not fit the recent project you described?
