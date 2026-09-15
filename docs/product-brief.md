# StagePaid Product Brief

**Status:** Draft

**Last updated:** 2026-09-13

## Summary

StagePaid is a mobile-first invoicing platform for independent professionals
whose client work progresses through reviewable, billable stages. It creates a
shared record connecting the agreed scope, evidence of completed work, client
approval, invoicing, and payment status.

StagePaid is intended to work for both field-based and remote service providers.
Its initial launch hypothesis focuses on small residential general contractors
and remodelers while preserving the workflow they share with later markets. See
[Launch Customer](product/launch-customer.md).

## Problem

Project scope, progress evidence, approvals, revisions, invoices, and payment
conversations are commonly spread across email, text messages, cloud folders,
accounting tools, and verbal agreements. When those records are disconnected,
service providers struggle to demonstrate that a milestone is complete and
clients struggle to understand exactly what they are being asked to approve or
pay for.

This creates avoidable uncertainty, administrative work, approval delays,
payment delays, and disputes.

## Target users

### Primary launch user and buyer

The initial primary user is the person responsible for client-facing milestones,
documentation, approval, and billing in a small residential general contracting
or remodeling business. The broader product serves an independent professional
or small service business that:

- delivers client work over multiple stages;
- can define observable outputs or acceptance criteria for those stages;
- provides clients with a clear way to review and approve work before the
  provider continues or bills; and
- currently coordinates that process across several disconnected tools.

The service provider is expected to choose and pay for StagePaid. The client is
an essential participant, but should not need to purchase or learn a complex
project-management system to review work.

### Market personas

#### Initial: field-based service provider

A general contractor, specialty contractor, installer, fabricator, or repair
professional who documents physical progress on-site and bills at agreed project
milestones.

Typical evidence includes photos, notes, completion checklists, and documented
changes to the original scope.

#### Later expansion: remote service provider

A freelancer, consultant, designer, developer, marketer, or other remote
professional who delivers drafts, revisions, and final outputs across defined
project phases.

Typical evidence includes files, links, written summaries, previews, and a
record of requested revisions.

### Client participant

A homeowner, business client, or project stakeholder who needs a quick and
credible way to understand what was promised, see what was delivered, approve or
request revisions, and understand what is due.

## Core job to be done

> When I complete a meaningful stage of client work, help me show what was
> agreed and what was delivered, obtain a clear decision from the client, and
> request payment against that approved work so that neither side has to
> reconstruct the project history later.

## Product promise

**Invoice by stage. Get StagePaid.**

StagePaid turns each project stage into a traceable sequence:

**Agreement → Evidence → Submission → Client decision → Invoice → Payment status**

## Proposed workflow

1. The service provider creates a project and invites the client.
2. The provider defines stages, deliverables or acceptance criteria, amounts,
   and expected dates.
3. Both parties can refer to the accepted project structure as work progresses.
4. The provider attaches evidence and submits a stage for review.
5. The client approves the stage or requests a revision with a written reason.
6. The provider records and resubmits revisions when necessary.
7. An approved stage becomes eligible for invoicing.
8. Both parties can see invoice and payment status in the context of the stage.
9. The project retains a chronological record of important actions.

## MVP boundary

The MVP should validate whether connecting evidence and explicit client approval
to milestone invoicing reduces ambiguity and shortens the path to payment.

### Included

- Service-provider account and business profile
- Client invitation and low-friction client access
- Project creation
- Stages with descriptions, amounts, dates, and acceptance criteria
- Project and stage status
- Notes, photos, files, and links as stage evidence
- Stage submission for client review
- Explicit approval or revision request
- Revision and resubmission history
- Invoice generation for an approved stage
- Invoice and payment-status tracking
- Notifications for review, revision, approval, and payment events
- Chronological activity record
- Responsive experiences for field and remote work

### Explicitly excluded from the initial MVP

- General ledger, bookkeeping, payroll, or tax preparation
- Full construction-project management
- Scheduling crews, dispatching, or time tracking
- Bidding marketplaces or lead generation
- Inventory, procurement, or subcontractor management
- Construction-specific compliance, permits, lien waivers, or retainage
- Escrow, lending, collections, or dispute adjudication
- Complex enterprise permissions and approval chains
- Industry-specific workflow variants
- Native mobile applications unless validation shows they are necessary

## Product principles

- **One shared record:** Keep scope, proof, decisions, invoices, and payment
  status connected to the stage they concern.
- **Fast client participation:** A client should be able to review and respond
  without configuring a workspace.
- **Useful wherever work happens:** The core experience must support a job site,
  a home office, and a phone in either setting.
- **Explicit decisions:** Approval, revision, and scope changes should be clear
  actions rather than conclusions inferred from conversation.
- **Common workflow first:** Solve the shared staged-work problem before adding
  industry-specific depth.
- **Human authority:** People remain responsible for agreements, approvals, and
  payments.

## Early success signals

The MVP will look promising if pilot users can:

- create a real staged project without hands-on setup assistance;
- get a client to review a stage without onboarding friction;
- move stages from submission to a recorded decision;
- produce invoices that clients understand in the context of approved work;
- reduce follow-up messages needed to clarify status or payment; and
- choose StagePaid again for a subsequent project.

Specific numeric targets should be set after initial customer discovery provides
realistic baselines.

## Key assumptions to validate

- Field-based contractors and remote freelancers share enough workflow for one
  coherent first product.
- Service providers are willing to define stages and acceptance criteria before
  or during a project.
- Clients will use a dedicated review experience when access is sufficiently
  simple.
- Explicit approval provides meaningful value beyond an ordinary invoice and
  email thread.
- Providers will attach evidence consistently when it directly supports approval
  and payment.
- Payment-status tracking may validate the workflow before integrated payment
  processing is required.

## Risks

- Serving both physical and digital work could make the product feel generic.
- “Approval” may carry different contractual meaning across industries and
  jurisdictions.
- General contractors may expect specialized features that are outside the MVP.
- Remote freelancers may already consider their project-management and invoicing
  tools adequate.
- Client participation could become the main adoption bottleneck.
- Handling payments directly would introduce substantial operational, security,
  compliance, and support obligations.

## Open questions

1. What establishes the initial agreement on stages and acceptance criteria?
2. How should StagePaid represent scope changes after work begins?
3. Does the MVP need payment collection, a payment-provider integration, or only
   payment-status tracking?
4. Which evidence types are essential for both physical and remote work?
5. What is the smallest complete project that can validate repeat usage?

## Decision record

- **2026-09-13:** Define the audience by staged client work rather than by work
  location or a single profession.
- **2026-09-13:** Include field-based general contractors and remote freelancers
  as initial personas.
- **2026-09-13:** Keep the common MVP free of construction-specific and
  profession-specific administration.
- **2026-09-13:** Let clients participate without permanent accounts by using a
  secure invitation, first-access email code, time-limited session, and confirmed
  display name. See [Client Access](product/client-access.md).
- **2026-09-13:** Treat stage approval as explicit operational acceptance of one
  fixed submission revision, distinct from invoicing, payment, contractual
  modification, or formal electronic signature. See [Stage
  Approval](product/stage-approval.md).
- **2026-09-13:** Require an explanatory message when a client requests changes.
  A request returns the stage to the provider but does not alter agreed scope,
  price, or schedule; expanded work requires a separate scope-change workflow.
  See [Requested Changes](product/requested-changes.md).
- **2026-09-13:** Automatically prepare one draft invoice when a stage is
  approved, but require the provider to review and explicitly issue it. Approval,
  invoice issuance, and payment remain separate events. See [Invoice
  Trigger](product/invoice-trigger.md).
- **2026-09-13:** Allow a provider to withdraw an awaiting submission before a
  client decision, including after it has been viewed. Withdrawal requires a
  client-visible explanation, preserves history, and prevents later action on
  that revision. See [Submission Withdrawal](product/submission-withdrawal.md).
- **2026-09-13:** Allow optional evidence-specific notes within a Change Request
  while retaining one required overall message and one decision event. Defer
  standalone comments, threads, and markup. See [Evidence
  Feedback](product/evidence-feedback.md).
- **2026-09-13:** Focus initial customer discovery and launch positioning on small
  residential general contractors and remodelers with multi-stage homeowner
  projects and milestone billing. Preserve remote professionals as a later
  expansion market. See [Launch Customer](product/launch-customer.md).
- **2026-09-13:** Model project work, submissions, client review, Change Requests,
  billing, and payment as related but independent lifecycles. Present concise
  stage summaries as derived views rather than mutable source states. See
  [Staged-Work Lifecycle](product/staged-work-lifecycle.md).
- **2026-09-14:** Represent invoice document state, balance state, and immutable
  payment events independently so partial payments, refunds, reversals, and
  overpayments remain explicit. See [Invoice and Payment
  States](product/invoice-payment-states.md).
- **2026-09-14:** Make **Pay balance** the primary MVP client payment action.
  Preserve partial-payment states for external payments, refunds, reversals,
  disputes, and exceptional processor events without offering a
  client-selected partial-payment flow.
- **2026-09-14:** Require an invoice total greater than zero at issuance. A
  zero-dollar stage ends with its approval and completion record instead of a
  synthetic invoice marked **Paid**.
- **2026-09-14:** Use immediate payment collection in the MVP. Only a
  server-verified successful attempt creates an immutable payment record and
  affects the balance; delayed capture remains deferred.
- **2026-09-14:** Allow only the provider to record partial or full external
  payments in the MVP. Clearly identify them as provider-recorded and not
  processed or verified by StagePaid; notify the client and correct errors
  through immutable reversals rather than edits or deletion.
- **2026-09-14:** Allow provider-initiated full or partial refunds in the MVP.
  Only confirmed results affect invoice balances; external refunds are recorded
  but not processed by StagePaid, while processor reversals and disputes enter
  through authenticated server events.
- **2026-09-14:** Treat **Overpaid** as an accurate balance state and show
  **Disposition required**, block further payment, and return the excess through
  an explicit refund or reversal. Defer unapplied credits and cross-invoice
  allocation.
- **2026-09-14:** Target partial-payment agreements and client-selected partial
  payments for version 1.1.0 while preserving an MVP data model that can
  represent multiple payment events.
- **2026-09-14:** Process MVP card and ACH bank payments through Stripe Connect.
  Keep ACH balances unchanged until server-confirmed success, collect sensitive
  credentials only through Stripe-provided components, and never store full
  card or bank credentials in StagePaid.
- **2026-09-14:** Correct an issued invoice through a linked, auditable
  correction draft that ends in **Void**, **Replaced**, or **Cancelled**. Never
  rewrite the original invoice; resolve applied funds before completion and give
  replacements new invoice numbers.
- **2026-09-14:** Keep the client invoice balance separate from provider
  settlement. Disclose and itemize Stripe and StagePaid fees, use a
  1% StagePaid transaction fee for MVP payments processed through StagePaid,
  charge no transaction fee on provider-recorded external payments, and return
  the StagePaid fee in proportion to any client refund, reversal, or dispute
  loss.
- **2026-09-14:** Retain finalized financial records for a seven-year U.S.-first
  product-policy baseline, subject to legal review and required extensions.
  Provide provider CSV/PDF exports and client-relevant PDFs while minimizing
  unrelated personal data.
- **2026-09-14:** Present persistent policy links and record versioned,
  affirmative provider and passwordless-client acknowledgements for the terms
  relevant to consequential actions. Do not present internal product
  specifications as legal terms.
- **2026-09-14:** Give clients immediate payment-attempt guidance and providers
  immediate dashboard visibility, but aggregate card retries into one provider
  alert after a 15-minute unresolved-session grace period. Use processor-informed
  timing for ACH and never expose private decline details.
- **2026-09-14:** Build the first clickable prototype as a repository-hosted,
  mobile-first static web experience using only synthetic fixtures. Simulate the
  complete stage-to-payment path without production authentication, uploads,
  persistence, notifications, or payment processing.
