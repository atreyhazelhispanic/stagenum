# Stagenum

**Make every stage count.**

Stagenum is a mobile-first invoicing platform for independent professionals and
their clients. It helps both sides document completed work, approve milestones,
and keep payment expectations clear from the beginning of a project through its
final payment.

> [!NOTE]
> Stagenum is in product definition and prototyping. The repository includes a
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

Stagenum is intended to make the history of the work part of the invoice—not an
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

Stagenum is initially focused on small, service-based projects where work is
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

## MVP product scope

The current product definition and research prototype explore:

- service-provider and client project views;
- staged estimates or agreements;
- milestone amounts and acceptance criteria;
- photo and note capture;
- change and revision history;
- client review, approval, and revision requests;
- invoices tied to approved work;
- payment-status tracking; and
- reminders and notifications around review and payment events.

Exact production release boundaries remain subject to user research and are
tracked in the product documentation.

### Not an initial goal

Stagenum is not intended to begin as a general-purpose accounting suite, a full
construction-management platform, a labor marketplace, or a replacement for
legal advice. Integrations and adjacent workflows should earn their place by
making staged approval and payment meaningfully better.

## Try the prototype

The repository includes a mobile-first, synthetic-data walkthrough of the core
provider and client journey. It begins on a provider projects dashboard and
covers stage submission, client approval or a Change Request, resubmission,
invoice issuance, simulated payment, receipt creation, and the updated project
state.

Requirements: Node.js 22.13.0 and npm. The root `.nvmrc` records the supported
Node.js version for tools such as nvm.

```bash
nvm use
cd prototype
npm ci
npm run dev
```

Open the local address printed by the development server. No account,
credentials, external service, or real payment information is required. The
prototype does not persist changes; use **Reset demo** or refresh the page to
restore its synthetic fixture.

To reproduce the required repository checks locally:

```bash
npm run lint
npm run build
npm run test:e2e
```

GitHub Actions runs `npm ci`, lint, the production build, and the guided browser tests for every pull
request and every push to `main`. See
[`prototype-ci.yml`](.github/workflows/prototype-ci.yml) for the pipeline.

To check the current dependency advisory database separately:

```bash
npm audit
```

## Project status

Stagenum is in problem validation and prototype testing, not production. The
current repository demonstrates the intended experience and records the
decisions needed to build it responsibly. Foundational materials include:

- the [product brief](docs/product-brief.md);
- the [brand-language guide](docs/marketing/brand-language.md);
- the [initial system architecture](docs/architecture/initial-system-architecture.md),
  including rendered container and transaction-sequence diagrams;
- the [production domain model](docs/architecture/production-domain-model.md),
  initial PostgreSQL migration, and rendered entity-relationship diagram;
- the [architecture decision record index](docs/adr/README.md), containing the
  accepted technical decisions and reusable ADR template;
- the [clickable prototype specification](docs/product/clickable-prototype.md);
- the repository-owned interactive prototype under [`prototype/`](prototype/);
- the [contractor interview plan](docs/research/contractor-interview-plan.md)
  and participant-facing [questionnaire](docs/research/contractor-async-questionnaire.md);
  and
- product and research records under [`docs/product/`](docs/product/) and
  [`docs/research/`](docs/research/).

The proprietary license is included. Contribution and security-reporting
guidance remain planned work. There is no production deployment, public API,
real authentication, durable data store, file upload, notification delivery, or
payment processing in this repository.

## Repository layout

Product, research, marketing, legal-screening, and architecture documentation
lives under `docs/`; the research prototype lives under `prototype/`; synthetic
fixture data lives under `prototype/data/`; and significant technical decisions
are recorded under `docs/adr/`.

## Contributing

Stagenum is not currently accepting external code or documentation
contributions. Please use the repository's issue tracker for discussion and do
not submit creative contributions unless a separate contribution policy or
written agreement applies.

## License

Copyright © 2026 Angelo Flores. All rights reserved.

Stagenum is publicly viewable for limited evaluation, but it is not open
source. Copying, modification, redistribution, commercial use, production use,
and derivative works are prohibited except as expressly permitted in the
[Stagenum Proprietary License](LICENSE) or required by the repository hosting
platform's terms.
