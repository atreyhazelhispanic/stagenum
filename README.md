# StagePaid

**Invoice by stage. Get StagePaid.**

StagePaid is a mobile-first invoicing platform for independent professionals and
their clients. It helps both sides document completed work, approve milestones,
and keep payment expectations clear from the beginning of a project through its
final payment.

> [!NOTE]
> StagePaid is in product definition and prototyping. The repository includes a
> clickable research prototype built with synthetic data, but it is not a
> production application and does not process real payments.

## The problem

Traditional invoices describe what is owed, but often fail to show how the work
reached that point. For projects completed in stages, that gap can lead to:

- unclear expectations about what “done” means;
- scattered photos, notes, and approval messages;
- disputes over whether a milestone was completed;
- delayed invoices and payments; and
- poor visibility into what is approved, due, or overdue.

StagePaid is intended to make the history of the work part of the invoice—not an
afterthought assembled when something goes wrong.

## Product vision

A service provider should be able to define a project as a sequence of payable
stages, capture evidence while working, and request approval wherever the work
happens. A client should be able to understand what changed, approve a stage,
and pay with confidence from any device.

The core workflow is:

1. **Define** the project, its stages, acceptance criteria, and payment schedule.
2. **Document** progress with notes, photos, and other supporting evidence.
3. **Submit** a completed stage to the client for review.
4. **Approve** the work or request a clearly documented revision.
5. **Invoice and pay** against the agreed milestone.
6. **Preserve** a shared record of the project from agreement through payment.

## Who it is for

StagePaid is initially focused on small, service-based projects where work is
visible, milestone-driven, and commonly performed away from a desk—for example,
home services, specialty trades, fabrication, installation, repair, creative
production, and event work.

The product serves two primary participants:

- **Service providers**, who organize work, prove progress, request approval,
  and get paid.
- **Clients**, who review scope and evidence, approve completed stages, and track
  payments.

## Product principles

- **Mobile first.** The essential workflow must work comfortably at the job site.
- **Clarity before collection.** Scope, acceptance, and payment expectations
  should be visible before money is due.
- **Evidence in context.** Photos, notes, revisions, approvals, and payments
  belong to the stage they describe.
- **Low friction for clients.** Reviewing and approving work should not require
  learning project-management software.
- **Trust through a shared record.** Important project events should be clear,
  attributable, and difficult to misunderstand.
- **Human control.** Automation may assist, but people remain responsible for
  agreements, approvals, and payments.

## Initial product scope

The first usable release is expected to explore:

- service-provider and client project views;
- staged estimates or agreements;
- milestone amounts and acceptance criteria;
- photo and note capture;
- change and revision history;
- client review, approval, and revision requests;
- invoices tied to approved work;
- payment-status tracking; and
- reminders and notifications around review and payment events.

Exact release boundaries will be recorded in the product brief before
implementation begins.

### Not an initial goal

StagePaid is not intended to begin as a general-purpose accounting suite, a full
construction-management platform, a labor marketplace, or a replacement for
legal advice. Integrations and adjacent workflows should earn their place by
making staged approval and payment meaningfully better.

## Project status

The project is currently validating its workflow while establishing production
requirements, architecture, and decision records. Foundational materials
include:

- the [product brief](docs/product-brief.md);
- the [initial system architecture](docs/architecture/initial-system-architecture.md),
  including rendered container and transaction-sequence diagrams;
- the [architecture decision record index](docs/adr/README.md), containing the
  accepted technical decisions and reusable ADR template;
- the [clickable prototype specification](docs/product/clickable-prototype.md);
- the repository-owned interactive prototype under [`prototype/`](prototype/);
  and
- product and research records under [`docs/product/`](docs/product/) and
  [`docs/research/`](docs/research/).

Contribution and security guidance and licensing terms remain planned work.

No production deployment, public API, or supported installation process exists
yet.

## Repository layout

The repository structure will evolve with implementation. Product, research,
and architecture documentation lives under `docs/`; the research prototype
lives under `prototype/`; and significant technical decisions will be recorded
under `docs/adr/`.

## Contributing

StagePaid is not currently accepting external code or documentation
contributions. Please use the repository's issue tracker for discussion and do
not submit creative contributions unless a separate contribution policy or
written agreement applies.

## License

Copyright © 2026 Angelo Flores. All rights reserved.

StagePaid is publicly viewable for limited evaluation, but it is not open
source. Copying, modification, redistribution, commercial use, production use,
and derivative works are prohibited except as expressly permitted in the
[StagePaid Proprietary License](LICENSE) or required by the repository hosting
platform's terms.
