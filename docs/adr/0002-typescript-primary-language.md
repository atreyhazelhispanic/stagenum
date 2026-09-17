# ADR-002: Use TypeScript as the primary application language

**Status:** Accepted

**Date:** 2026-09-16

**Decision owners:** Stagenum maintainers

## Context

Stagenum will initially include a browser-based interface, an application API,
background workers, shared domain rules, and integrations with payment, email,
and object-storage providers. A future native mobile application is also likely
because providers and clients commonly interact with staged work from phones.

The product's most important workflows cross interface and server boundaries.
Submission revisions, approvals, Change Requests, invoice eligibility, payment
events, and access grants must use consistent terminology and data contracts.
Using unrelated languages for each initial runtime would increase translation
work and make contract drift more likely while the domain is still evolving.

React, React Native, and TypeScript serve different purposes. React is a web UI
library, React Native renders native mobile interfaces, and TypeScript is the
language that can be used by either interface and by the server. Choosing
TypeScript does not require business logic to live in React components or make
web and mobile interface components interchangeable.

## Decision

Stagenum will use **TypeScript as its primary application language** for:

- server-side domain and application modules;
- the external API and background workers;
- the React web interface;
- shared validation schemas, API contracts, and client libraries; and
- a future React Native mobile application, if that application is built.

Authoritative business rules will execute in server-side modules. Web and mobile
clients may share types, validation, formatting, and API-client code, but they
will not be treated as authoritative sources for permissions, financial state,
or lifecycle transitions.

Another language may be introduced when a measured technical requirement makes
it materially better for a bounded component. Doing so requires an ADR that
defines the boundary, ownership, deployment, data contract, and operational
cost.

## Decision details

### TypeScript expectations

Production TypeScript will use strict compiler settings. Application code must
not weaken those settings globally to accommodate a local implementation.

The codebase will prefer:

- explicit domain types and value objects over unstructured records;
- `unknown` plus validation at untrusted boundaries rather than `any`;
- discriminated unions for lifecycle states and business outcomes;
- exhaustive handling of state transitions where practical;
- runtime validation for HTTP input, stored external payloads, environment
  configuration, jobs, and provider webhooks; and
- generated or shared contracts only when their ownership and compatibility
  rules are clear.

Static types do not validate data received at runtime. Every external boundary
must parse and validate its input before converting it into trusted domain
types.

### React web interface

The browser application may use React with `.tsx` components. React is an
interface dependency, not the domain architecture. Components may present
state and request use cases, but they must not determine authoritative approval
eligibility, invoice balances, access rights, or payment outcomes.

Browser-only concerns such as DOM elements, CSS, local storage, and web routing
remain inside the web application.

### Future React Native interface

A future React Native application may also use TypeScript and React concepts,
but it renders native mobile components rather than HTML. It will normally have
its own screens, navigation, accessibility behavior, secure storage, file and
camera access, notifications, and platform-specific payment handling.

The web and mobile applications may share:

- domain vocabulary and non-authoritative display types;
- runtime validation schemas and serialized API contracts;
- API-client and authentication-protocol code;
- money, date, and status formatting utilities; and
- pure business calculations that are safe to reproduce for display.

They should not be expected to share:

- React DOM or React Native view components;
- navigation implementations;
- browser or native storage adapters;
- file, camera, notification, or deep-link integrations; or
- client-side copies of authoritative server decisions.

Shared packages must not import browser, Node.js, or native-only APIs unless the
package explicitly targets that runtime.

### Financial and security boundaries

Payment credentials will be handled through approved provider SDKs and hosted
or native payment elements where applicable. Stagenum TypeScript types must not
create the impression that raw card data is safe to receive or store.

Stripe webhooks and other external events remain untrusted until their
signatures, identifiers, schemas, and processing eligibility are verified on
the server. Client-supplied totals, roles, project grants, and lifecycle states
are treated as requests or display values, never as authority.

### Interoperability

TypeScript modules will use documented interfaces for infrastructure and
external providers. Data stored for long-term use must have an explicit schema
and migration strategy rather than depending on TypeScript's compile-time shape.

Protocol contracts must remain understandable outside TypeScript. JSON payloads,
database schemas, webhook formats, and exported records cannot rely only on
language-specific types for their meaning.

## Consequences

### Positive

- The initial team can use one language across the web, API, workers, and shared
  packages.
- Domain terminology and API contracts can be reused without manually
  translating types between initial application runtimes.
- Type checking can catch incompatible state handling and contract changes
  during development and continuous integration.
- React web experience transfers substantially to a future React Native codebase
  while leaving room for native interface design.
- The JavaScript ecosystem provides mature libraries and SDKs for the selected
  infrastructure providers.
- One primary toolchain simplifies local development, linting, testing, builds,
  dependency management, and onboarding.

### Negative and tradeoffs

- TypeScript adds compilation and configuration beyond plain JavaScript.
- Its types are erased at runtime, so validation remains necessary at every
  untrusted boundary.
- Unsafe assertions, broad `any` usage, or poorly designed shared types can hide
  rather than prevent defects.
- Sharing a language can encourage inappropriate sharing of UI or environment-
  specific code.
- CPU-intensive or specialized workloads may eventually be better served by a
  different language or managed service.
- The Node.js ecosystem requires active dependency and supply-chain hygiene.

## Alternatives considered

### JavaScript without TypeScript

Plain JavaScript would reduce initial type configuration, but it provides less
automated protection for evolving lifecycle states, financial contracts, and
module interfaces. Stagenum accepts TypeScript's additional tooling in return
for stronger development-time feedback.

### Separate languages for browser and server

A server language such as Go, Java, C#, Python, or Rust could provide valuable
runtime or ecosystem characteristics. At the current scale, a second primary
language would add contract translation, tooling, and onboarding costs without
a demonstrated requirement that outweighs them.

This decision does not reject those languages for future bounded components.

### React Native as the universal interface

Using React Native for every interface could appear to maximize component
reuse, but web and native platforms have different interaction, accessibility,
navigation, storage, and distribution requirements. Stagenum will share
portable logic intentionally rather than making universal UI reuse an
architectural requirement.

### Full-stack framework types as the only API contract

Framework-inferred types can improve developer experience, but relying on them
alone can tightly couple clients to one server implementation and does not
replace runtime validation or durable protocol documentation. They may be used
within the boundaries established here, not as the sole source of trust.

## Security and privacy implications

- Runtime schemas validate all untrusted data despite compile-time types.
- Secrets and privileged provider SDKs remain in server-only modules.
- Shared packages must be reviewed to prevent server secrets or privileged code
  from entering browser or mobile bundles.
- Authorization is enforced by server-side application use cases for every
  protected operation.
- Logs, errors, and telemetry must avoid exposing access codes, session tokens,
  private evidence, personal data, or payment credentials.
- Dependency scanning, lockfile review, and timely upgrades are required across
  the JavaScript package supply chain.

## Validation and enforcement

The implementation will enforce this decision through:

- strict TypeScript compiler settings in production packages;
- lint rules that restrict unsafe types and environment-crossing imports;
- runtime schema tests for API, job, configuration, and webhook boundaries;
- type checking, linting, tests, and builds in continuous integration;
- package boundaries that distinguish server-only, web-only, native-only, and
  portable shared code;
- contract and integration tests between clients and the API; and
- code review for type assertions, exported contracts, and duplicated business
  rules.

## Revisit triggers

A new ADR should reconsider this decision when:

- a bounded workload cannot meet established performance or reliability goals
  after reasonable TypeScript and infrastructure optimization;
- a required platform SDK or regulated environment cannot be supported safely;
- a specialist component has a mature ecosystem in another language and a
  stable contract justifies the operational cost;
- the JavaScript runtime creates a measured security or operational constraint;
- mobile requirements demonstrate that React Native is unsuitable; or
- shared contracts create tighter coupling than their reuse benefits justify.

A developer's language preference alone is not sufficient. The proposal must
identify measurable benefits, the ownership boundary, interoperability model,
deployment plan, and long-term maintenance cost.

## Related decisions and documents

- [ADR-001: Start with a modular monolith](0001-modular-monolith.md)
- [Initial system architecture](../architecture/initial-system-architecture.md)
- [System-container diagram](../architecture/diagrams/system-containers.mmd)
- GitHub issue #7: Record foundational architecture decisions
