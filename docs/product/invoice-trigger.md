# Invoice Trigger

**Status:** Draft

**Last updated:** 2026-09-13

## Objective

Turn an approved stage into a provider-controlled billing action without making
client approval unexpectedly send an invoice or initiate payment.

## Decision

When a client approves a stage, StagePaid automatically creates one draft invoice
from the approved stage. The draft is visible to the provider for review but is
not issued or sent to the client.

The provider must explicitly review and issue the invoice. Only issuance creates
the client-facing invoice and begins its payment terms.

This separates three events:

1. **Approval:** The client accepts a specific stage submission.
2. **Invoice issuance:** The provider reviews and sends the billing request.
3. **Payment:** Money is collected or a payment is recorded.

None of these events implies that either of the others has occurred.

## Why approval creates a draft

Automatically preparing the draft preserves momentum after approval and avoids
making the provider re-enter information that StagePaid already knows. Requiring
provider issuance creates a deliberate checkpoint for reviewing:

- billing identity and address;
- approved stage amount;
- applicable taxes or clearly disclosed adjustments;
- invoice description;
- payment terms and due date;
- payment instructions; and
- client-facing notes.

It also prevents a mistaken approval from immediately sending a financial
document to the client.

## Approval result

After recording approval, StagePaid:

1. marks the submitted revision approved;
2. records the approval event;
3. marks the stage ready for billing;
4. creates or returns the single draft invoice associated with that approval;
5. notifies the provider that the draft is ready; and
6. shows the client that an invoice has not yet been issued.

The approval operation and draft-creation operation must be idempotent. Retrying
either operation cannot create duplicate approvals or invoices.

## Client-facing approval confirmation

The approval acknowledgement should say:

> By approving, you confirm that you reviewed this submission and accept it as
> completing the stage described above. StagePaid will prepare a draft invoice
> for **[provider name]** to review. This does not send an invoice or record
> payment.

After approval, the receipt should show:

> **Stage approved**
>
> **[provider name]** will review the billing details. You will receive the
> invoice separately if and when it is issued.

## Provider flow

### 1. Draft ready

The provider receives a **Review invoice** action linked from the approved stage
and approval notification.

### 2. Review billing details

The draft displays:

- provider and client billing details;
- project and approved stage;
- approved submission revision;
- stage description;
- approved stage amount and currency;
- taxes, discounts, or other permitted adjustments;
- payment terms and calculated due date preview;
- payment instructions; and
- client-facing notes.

### 3. Resolve discrepancies

The provider can correct administrative information before issuance. The
provider cannot silently increase the approved stage amount or change the agreed
deliverables through the invoice.

If the amount or work must materially change, the provider returns to the
appropriate scope-change or approval workflow. A discount may reduce the amount
owed without new client approval. Taxes and other additions must be permitted by
the underlying agreement and presented separately from the approved stage amount.

### 4. Preview and issue

The provider previews exactly what the client will receive and selects **Issue
invoice**. Issuance requires a separate confirmation and produces the official
invoice identifier.

## Draft behavior

- One approval produces at most one active draft invoice for that stage.
- The draft retains a reference to the approval and approved submission revision.
- Reopening the billing action returns the existing draft rather than creating
  another.
- A draft has an internal identifier but does not require a final invoice number.
- Payment terms begin when the invoice is issued, not when the stage is approved.
- Editing a draft does not modify the approved submission or approval event.
- Deleting or abandoning a draft must not erase the approval history.

## Invoice issuance

Issuing the invoice:

- assigns its official invoice number;
- fixes the issued invoice contents as a new immutable billing snapshot;
- records the issue date and due date;
- changes the billing state from **Draft** to **Issued**;
- makes the invoice available in the client experience; and
- sends the configured client notification.

Later corrections to an issued invoice require a traceable billing workflow such
as voiding and replacement or a credit adjustment. The issued record is not
silently rewritten.

## State model

### Stage billing readiness

- **Not ready:** The stage does not have an approval eligible for billing.
- **Ready for billing:** The stage is approved and has a draft invoice.
- **Invoiced:** An invoice tied to the approval has been issued.

### Invoice

- **Draft:** Prepared for provider review; not visible as an issued invoice.
- **Issued:** Sent or made available to the client; payment terms have begun.
- **Partially paid:** Some but not all of the amount due has been recorded.
- **Paid:** The amount due has been fully recorded as paid.
- **Overdue:** The unpaid balance remains after the due date.
- **Void:** The invoice was invalidated through a recorded action.
- **Refunded:** Some or all recorded payment was returned.

Detailed payment and adjustment behavior will be defined separately.

## Failure and concurrency behavior

- Approval must not report complete unless the system can reliably produce or
  recover the associated draft.
- Retrying after an uncertain response returns the same draft.
- Concurrent requests cannot create two drafts for one approval.
- An invoice cannot be issued from a withdrawn, invalidated, or ineligible
  approval.
- If draft creation is delayed, the provider sees a recoverable processing state
  rather than an instruction to create a second invoice.
- Issuance is idempotent and cannot send duplicate invoices when retried.

## MVP boundary

### Included

- Automatic draft creation after stage approval
- One invoice per approved stage
- Provider review and preview
- Explicit provider issuance and confirmation
- Approved amount preserved as a distinct invoice component
- Taxes, discounts, payment terms, and notes
- Traceable links among stage, submission, approval, and invoice
- Separate approval, invoice, and payment states

### Deferred

- Combining multiple approved stages into one invoice
- Splitting one approved stage across multiple invoices
- Recurring invoices
- Deposits and pre-approval billing
- Credit notes and complex invoice corrections
- Multi-currency projects
- Client self-billing
- Automatic invoice issuance immediately upon approval
- Detailed payment processing and reconciliation

## MVP acceptance criteria

- Each approval creates or recovers exactly one draft invoice.
- Approval alone never issues or sends an invoice.
- The client is told that the invoice will arrive separately if issued.
- The provider can review and preview the complete invoice before issuance.
- The provider explicitly confirms issuance.
- The approved stage amount remains distinguishable from taxes and adjustments.
- The provider cannot silently increase the approved stage amount in the draft.
- The official invoice number and payment terms begin at issuance.
- The invoice retains references to its stage, submission revision, and approval.
- Retries and concurrent actions cannot create duplicate drafts or issued
  invoices.

## Remaining decisions

1. Which taxes and adjustments can the provider add without renewed approval?
2. What default payment terms should StagePaid suggest?
3. What correction workflow applies after invoice issuance?
4. When should the provider be allowed to abandon or void a draft?
5. Does customer discovery support one invoice per stage as the MVP constraint?
