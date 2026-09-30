# ADR-011: Use Expo for provider mobile access while retaining the web application

**Status:** Accepted

**Date:** 2026-09-29

**Decision owners:** Stagenum maintainers

## Context

Stagenum is intended to make staged work easy to document, review, and pay for
where the work occurs. Providers will commonly capture evidence and submit work
from a phone, while clients may review from a phone, tablet, or desktop without
wanting to install an application. Providers and support operators may also need
a larger-screen web experience for project setup, record review, and account
administration.

The accepted architecture already defines a TypeScript modular monolith, a
Next.js web and API runtime, passwordless project-scoped client access, private
object storage, and verified Stripe webhooks as payment authority. Adding mobile
access must reuse those boundaries rather than create a second backend, copy
business rules into a device, or make a native application mandatory for a
client to approve and pay.

The first mobile client must be practical for a solo founder to develop and
operate across iOS and Android. It needs ordinary access to the camera and photo
library, secure local credential storage, deep links, notifications, uploads,
and Stripe-hosted payment surfaces. It must also preserve an escape path when a
future platform capability cannot be implemented reliably through a shared
React Native layer.

## Decision

Stagenum will use **Expo with React Native and TypeScript** for the
provider-facing iOS and Android application. The application will consume the
same authenticated HTTP API used by the responsive web application. It will not
connect directly to PostgreSQL, hold unrestricted object-storage credentials,
or become authoritative for lifecycle or payment state.

Stagenum will retain its **responsive Next.js web application** for:

- the passwordless client review, Change Request, approval, invoice, and payment
  experience;
- providers who prefer or require a desktop or laptop workflow;
- administrative and support workflows; and
- a universally accessible experience when installing a native application is
  unnecessary or undesirable.

The product is therefore mobile-first, not mobile-only. Native and web clients
are separate presentation surfaces over the same server-authoritative domain
model and application API.

## Decision details

### Client responsibilities

The Expo application owns native navigation, local presentation state, device
permissions, camera and photo selection, secure session persistence, deep-link
handling, notification registration, and resilient upload initiation. It may
optimistically present a pending operation, but it must reconcile against the
server response before presenting a business transition as authoritative.

The responsive web application owns equivalent browser presentation concerns.
It remains a supported provider surface rather than a temporary compatibility
page. The client review flow remains browser-first and passwordless so a client
can act from a scoped invitation without installing Stagenum.

Neither client implements authorization, approval eligibility, invoice totals,
payment authority, evidence access policy, or other domain invariants. Those
remain server-side application and domain behavior.

### Shared TypeScript boundary

The mobile and web applications may share framework-neutral TypeScript packages
for validated API contracts, identifiers, schemas, formatting rules, and safe
domain utilities. They do not share React DOM components, Next.js handlers,
React Native views, navigation state, browser cookies, or native credential
storage implementations.

Shared packages must not turn the repository into a distributed monolith of
presentation imports. Dependency-boundary tests will ensure mobile and web code
depend inward on shared contracts rather than on each other's frameworks.

### Authentication and client access

Provider authentication will use a server-issued session appropriate to a
public native client. Long-lived session material, when necessary, is stored
only through platform-protected secure storage and is revocable by the server.
The application bundle contains no private API credential or server secret.

Native deep links are treated as untrusted input. The API authenticates and
authorizes every protected request, and device possession alone does not grant
project access. The exact provider sign-in, renewal, revocation, and device-loss
contract is recorded in a separate bounded decision before implementation.

Client invitations continue to use the passwordless, project-scoped web access
defined by [ADR-008](0008-passwordless-project-scoped-access.md). A client is
not required to create a provider account or install the mobile application.

### Evidence capture and uploads

The Expo application may capture or select evidence, validate basic type and
size constraints, and request short-lived upload instructions from the API.
The server reauthorizes the actor, project, stage, object purpose, and quota
before issuing access. Object storage remains private and the database remains
authoritative for evidence metadata and relationships.

MVP behavior supports at most 10 evidence images per stage. Upload retries must
be idempotent and observable, and an interrupted upload must not create a
submitted stage revision. Continuous GPS tracking and AI image interpretation
remain deferred beyond the MVP.

### Payments

The React Native application may use Stripe's maintained React Native SDK and
hosted PaymentSheet for supported payment methods. The server creates payment
intent, customer, and Connect operations and returns only scoped client values
needed by the SDK. Secret Stripe credentials and raw card or bank details never
enter the application bundle or Stagenum-controlled fields.

A successful device-side confirmation is not payment authority. Verified,
idempotently processed Stripe webhooks remain authoritative under
[ADR-007](0007-stripe-webhook-payment-authority.md). The mobile and web clients
display server-reconciled payment state.

Payments for provider work performed outside the application are distinct from
future purchases of digital Stagenum features. Any paid tier or subscription
that unlocks application functionality requires a separate app-store billing
and policy decision before release.

### Expo build model

Expo Go may be used for early presentation work when its capability set is
sufficient. Stagenum will use an Expo development build once testing requires
the real application identifier, secure storage, notifications, deep links,
Stripe native configuration, or other native modules.

Signed beta and release artifacts will be produced through a documented build
pipeline such as EAS Build. Signing credentials, bundle identifiers, package
names, environment configuration, and store access are isolated between
development and production. An over-the-air JavaScript update may not bypass
release review for native-code, schema, security, payment, or policy changes.

### Native escape hatch

Expo is not an agreement to avoid native code permanently. Stagenum may use
Expo prebuild and a reviewed Swift, Kotlin, or maintained native module when a
measured requirement cannot be met responsibly through the supported Expo and
React Native APIs.

A native addition must be narrowly scoped, covered by platform-specific tests,
and justified by capability, reliability, security, policy, accessibility, or
measured performance. Native business rules must not fork the server domain
model.

## Consequences

### Positive

- One TypeScript-oriented mobile codebase can reach both iOS and Android.
- Providers receive a job-site experience without removing desktop access.
- Clients retain a low-friction browser flow with no installation requirement.
- One API and domain model prevent mobile and web from disagreeing about
  approval, invoice, or payment state.
- Expo supplies a managed path for common device capabilities, signed builds,
  and beta distribution while retaining a native escape hatch.
- Shared contracts can reduce integration drift without pretending that web and
  native user interfaces are interchangeable.

### Negative and tradeoffs

- Stagenum must design and test two presentation surfaces.
- Most web UI components cannot be reused directly in React Native.
- Native dependencies, operating-system permissions, store review, and signing
  add release work beyond web deployment.
- Expo and React Native upgrades must remain compatible with Stripe and other
  native modules.
- Offline and interrupted mobile behavior requires explicit retry,
  reconciliation, and user-feedback design.
- Platform-specific native code may still be required for a future capability.

## Alternatives considered

### Responsive web application only

This would minimize code and release surfaces. It provides weaker integration
with job-site camera workflows, secure device storage, notifications, and later
mobile capabilities, and may feel less dependable to providers whose primary
work device is a phone.

### Separate Swift and Kotlin applications

Fully native clients offer maximum platform control but would duplicate
presentation work and require two specialized release paths before Stagenum has
evidence that the additional cost creates meaningful product value.

### Require the native application for every participant

This would simplify product messaging at the cost of substantial client
onboarding friction. A client who only needs to review, request a change,
approve, or pay should not be required to install an application or create a
provider account.

### Package the web application in a native WebView

This would reuse the web interface but provide a weaker native experience and
would not remove the need to design permissions, uploads, secure storage, deep
links, notifications, and app-store behavior. It also risks obscuring rather
than defining the mobile security boundary.

## Reconsideration triggers

Reconsider this decision when one or more of the following is demonstrated:

- reliable continuous background location becomes an accepted product
  requirement and cannot meet platform expectations through supported modules;
- background transfers or processing cannot meet measured reliability needs;
- specialized Bluetooth, NFC, scanner, widget, App Clip, Live Activity, or
  other platform integration becomes necessary;
- a required payment, identity, or compliance SDK lacks an acceptable Expo or
  React Native integration;
- measured accessibility, startup, memory, animation, or workflow performance
  cannot meet the release target after profiling and reasonable optimization;
- native release failures or upgrade constraints repeatedly outweigh the value
  of the shared mobile codebase; or
- usage research shows that the provider web or client web experience should be
  materially expanded, reduced, or separated.

## Follow-up work

- Establish the Expo application foundation and repository boundary.
- Record provider authentication, renewal, revocation, deep-link, and
  device-loss behavior.
- Define native build signing, environment separation, TestFlight, and Google
  Play internal-testing promotion.
- Implement one end-to-end provider vertical slice before broad mobile feature
  expansion.
- Add cross-platform accessibility, upload-interruption, session-revocation,
  and payment-reconciliation tests.
