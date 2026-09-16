# ADR-008: Use passwordless, project-scoped client access

**Status:** Accepted

**Date:** 2026-09-16

**Decision owners:** StagePaid maintainers

## Context

StagePaid clients need to review evidence, approve an exact submission revision,
request changes, and pay invoices. Requiring every client to create and manage a
permanent account would add friction for people who may participate in only one
project.

An emailed review link alone is convenient but acts as a bearer credential that
can be forwarded, leaked through browser history or referrers, or opened on a
shared device. StagePaid needs greater confidence that the actor controls the
invited email address without claiming to establish legal identity.

Authentication and authorization must remain separate. Verifying access to an
email inbox establishes a client session; it does not grant access to every
provider, project, stage, invoice, or object associated with that address. Each
protected operation must enforce the active project grant and relevant
lifecycle rules.

## Decision

StagePaid will provide **passwordless client access using a high-entropy email
invitation plus a short-lived, single-use email verification code** on first
access from a browser without a valid session.

Successful verification creates an opaque, server-managed session limited to
the invitation's active client and project grant. The session is carried only
in a secure cookie. Authorization is evaluated on every protected request from
current server-side records.

Clients are not required to create a permanent account for the MVP. This method
verifies control of the invited email inbox at a point in time; it is not legal
identity proofing, multifactor authentication, or an electronic-signature
service.

## Decision details

### Principal, invitation, grant, and session

StagePaid models these concepts separately:

- A **client principal** is StagePaid's internal identity record for an invited
  client and normalized email address within the appropriate relationship.
- An **invitation** is a revocable route into one intended access flow.
- A **project grant** defines the provider, project, role, allowed capabilities,
  validity, and revocation state.
- A **verification challenge** proves control of the invited email inbox for
  that access attempt.
- A **session** represents a successful verification and references the
  principal and project grant it can exercise.

Possession of one identifier does not substitute for the other checks. In
particular, knowing a project or object identifier does not grant access, and an
invitation token alone does not authorize protected content on a new browser.

### Invitation issuance

The provider supplies and confirms the intended client email address. StagePaid
normalizes it for delivery and comparison without applying unsafe assumptions
that distinct provider-specific mailbox forms always represent one person.

An invitation:

- uses a cryptographically secure, high-entropy, unguessable token;
- is associated with one client principal and project grant;
- has issuance, expiration, replacement, and revocation state;
- may be resent without creating duplicate access records;
- is invalidated when replaced or revoked; and
- contains no project evidence, session credential, verification code, or
  sensitive business detail in the URL.

Only a non-reversible token verifier is stored. Raw invitation tokens are
available only long enough to construct the outgoing link and are redacted from
application logs, analytics, error reports, support tools, and referrer data.

Invitation URLs use an allowlisted HTTPS application origin rather than an
untrusted request host. Invitation landing pages set a restrictive referrer
policy and exchange or remove URL credentials before loading third-party
resources.

### Invitation opening

Opening a valid invitation establishes context but does not establish an
authenticated client session. The landing page reveals only the minimum needed
to explain the verification flow. Sensitive evidence, financial details, and
protected project content remain unavailable.

If the browser already has a valid session for that exact active grant, the
client may continue without another code. Otherwise, StagePaid offers to send a
code to the invitation's email address, displayed only in a safely masked form.

Responses do not reveal whether arbitrary emails, projects, or invitations
exist. Invalid, expired, replaced, and revoked links provide safe recovery
without exposing internal identifiers or another recipient's information.

### Verification challenges and codes

Each requested verification challenge:

- is generated using a cryptographically secure random source;
- is bound to the invitation, project grant, purpose, and intended email;
- has a short configurable lifetime;
- has a strict maximum number of attempts;
- becomes unusable after successful verification;
- is invalidated or superseded according to the resend policy; and
- cannot be used to authenticate a different invitation or project.

Codes are authentication secrets. StagePaid never stores or logs them in plain
text. Because human-entered codes have a small search space, storage uses a
keyed verifier with a server-held secret in addition to strict online attempt
limits; an ordinary fast unsalted hash would not adequately protect a leaked
database.

Code request and verification endpoints use independent, layered rate limits by
challenge or invitation, destination identity, network source, and relevant
device or abuse signals. Limits, resend cooldowns, and failures use generic
responses that do not help an attacker enumerate clients or tune guesses.

After a bounded number of failures or expiration, a new challenge is required.
Protective throttling does not permanently lock the client out; safe recovery
remains available through a replacement code or provider-issued invitation.

### Email delivery

Verification email contains the code, recognizable provider and project
context, expiry guidance, and a path for recipients who did not expect the
message. It does not include evidence attachments, complete invoice data, or a
link that silently submits the code.

Email delivery success does not prove inbox control. Only correct code
verification completes authentication. Delivery attempts and outcomes are
processed through the transactional outbox without storing the code in the job
payload longer than required by the chosen delivery design.

Client contact information is used for transactional project access and is not
used for marketing without separate informed consent.

### Session establishment

Successful verification atomically consumes the challenge and creates or
rotates an opaque session with a cryptographically random identifier. The
identifier is stored only as a non-reversible verifier on the server and sent to
the browser in a cookie configured with:

- `Secure`;
- `HttpOnly`;
- an appropriate `SameSite` policy, initially `Lax` unless a tested flow
  requires stricter or explicitly cross-site behavior;
- a narrow host and path scope; and
- no overly broad parent-domain scope.

Session identifiers never appear in URLs, local storage, analytics, or ordinary
logs. Session fixation is prevented by issuing a new identifier after
verification and other privilege changes.

The session record includes the principal, project grant, creation time,
absolute expiration, last relevant activity, revocation state, and limited
security metadata. Idle and absolute lifetimes are independently configurable.
Exact durations remain an implementation decision validated through usability
and threat testing.

### Session use and CSRF protection

Every request uses HTTPS. The server loads the session and current grant rather
than trusting client-supplied roles, email addresses, project IDs, or
capabilities.

State-changing requests require an allowed HTTP method, validated origin or
anti-CSRF mechanism, and an explicit user action. `SameSite` cookies are defense
in depth, not the only CSRF control. Navigation, viewing, inactivity, email
prefetching, or link scanning can never record approval or a Change Request.

Sensitive responses use restrictive caching and are not embedded in
unauthorized cross-origin contexts.

### Authorization model

Authorization checks the intersection of:

- a valid client session;
- an active, unexpired, unrevoked project grant;
- the grant's provider, project, role, and capabilities;
- the requested resource's ownership and visibility;
- the exact submission revision, invoice, or evidence relationship; and
- the current lifecycle state required for the action.

Queries scope resources through authorized relationships rather than loading a
record by public identifier and checking only afterward. Direct object
references, signed storage access, exports, and payment initiation all require
the same project scope.

The MVP session does not silently aggregate every project associated with the
same email address. Multi-project access or a permanent client account requires
an intentional product and authorization design.

### Display name and decision attribution

Before the first recorded client decision, the client enters or confirms the
display name that will appear in project history. The interface explains that
this is a client-supplied attribution label, not verified government identity.

Each approval or Change Request stores an immutable snapshot of:

- the client principal and project grant;
- the confirmed display name;
- the verified session or authentication event reference;
- the exact submission revision;
- the action, message where applicable, and server timestamp; and
- appropriate audit correlation data.

Changing a current display name or revoking access never rewrites prior event
attribution.

### Resend, replacement, and revocation

Resending an active invitation reuses its client and grant relationship and is
recorded without duplicating the client.

Replacing an invitation, such as after correcting an email address, invalidates
the old invitation, outstanding challenges, and sessions associated with the
replaced grant as soon as practical. Revocation similarly prevents new access
and invalidates current sessions for that grant.

Authorization reads current revocation state so a long-lived session cannot
continue solely because its cookie has not expired. Cached authorization must
have a bounded lifetime and a revocation strategy.

Revocation affects future access only. It does not erase approvals, Change
Requests, payments, or audit records already attributable to that client.

### Recovery and enumeration resistance

Expired or unusable access can request a replacement through a safe workflow
that notifies the known destination or provider without confirming arbitrary
relationships. Public responses use comparable status, content, and timing
where practical for valid and invalid identifiers.

Support cannot read or issue a client's code, impersonate the client, or mark a
decision as client-authenticated. Administrative replacement or revocation
requires authenticated authority and creates an audit event.

### Logging and security telemetry

StagePaid records security-relevant events such as invitation issuance,
replacement, revocation, code request, verification success, bounded failure
signals, session creation, session revocation, and authorization denial.

Logs exclude raw invitation tokens, codes, session identifiers, signed object
URLs, payment client secrets, and sensitive project contents. Network, device,
and abuse signals are internal security data with documented purpose, access,
retention, and deletion—not shared project-history content by default.

## Consequences

### Positive

- Clients can participate without creating or remembering a password.
- A forwarded invitation alone is insufficient on a new browser because inbox
  verification is also required.
- Server-managed sessions support immediate project-grant revocation.
- Project-scoped grants reduce exposure if one invitation or session is
  compromised.
- Explicit decision attribution preserves the exact actor context and revision.
- Opaque cookies keep authentication credentials out of JavaScript and URLs.
- The model can later support optional client accounts without weakening the
  initial project boundary.

### Negative and tradeoffs

- Email account compromise can compromise client access.
- Email delays, filtering, or outages can block timely review.
- Verification adds friction compared with a single magic link.
- Server-managed sessions require persistent storage, cleanup, and revocation
  checks.
- Rate limits must balance attack resistance against clients on shared networks
  or with accessibility needs.
- This method cannot prove legal identity, intent beyond the recorded action, or
  sole control of a shared inbox.
- A stolen active session remains useful until detected, expired, or revoked.

## Alternatives considered

### Invitation link as the only credential

A single link provides the smoothest entry but can be forwarded or exposed
through history, logs, referrers, email scanning, or a shared device. Requiring a
separately delivered code on a new browser reduces that risk.

### Email magic link that directly authenticates

Magic-link authentication can be secure when implemented carefully, but email
security scanners and accidental forwarding can consume or expose it. The MVP's
invitation-plus-code flow makes the authentication action explicit and keeps
the invitation useful as project context without making it sufficient alone.

### Require a permanent password account

Permanent accounts provide familiar recovery and multi-project identity but add
registration, password management, and abandonment risk for one-time clients.
They may be offered later rather than required for MVP participation.

### Social login or enterprise identity

External identity providers can strengthen account management but require the
client to possess or choose another account and add provider dependencies. They
do not match the initial low-friction, project-specific use case.

### Stateless signed session tokens

Self-contained tokens reduce session lookups, but immediate invitation and grant
revocation then requires short lifetimes or a separate revocation system.
Opaque server-managed sessions better fit the MVP's narrow scope and revocation
requirements.

### Treat email verification as legal identity or signature

Inbox control does not prove government identity, exclusive account control, or
compliance with every electronic-signature requirement. StagePaid records
authentication and explicit action without making that unsupported claim.

## Security and privacy implications

- Tokens, codes, and sessions use cryptographically secure randomness and are
  never retained in recoverable plaintext.
- Short code entropy is supplemented by keyed verification, strict attempt
  limits, expiry, and single use.
- Session cookies use `Secure`, `HttpOnly`, narrow scope, and a tested `SameSite`
  policy; session identifiers never use URL transport.
- Authorization is enforced on every object and action from current server-side
  grants.
- CSRF protection, explicit confirmation, and safe HTTP methods prevent passive
  browsing or email scanning from becoming a client decision.
- Generic responses, layered throttling, and careful timing reduce relationship
  and email enumeration.
- Invitation email, security telemetry, and project activity are sensitive data
  with purpose limitation and retention controls.
- Provider and support tooling cannot impersonate a client or access raw
  authenticators.
- High-risk projects may require stronger authentication in a future ADR.

## Validation and enforcement

The implementation will enforce this decision through:

- tests for token entropy, verifier storage, code expiration, single use,
  attempt limits, resend behavior, and challenge binding;
- tests that a forwarded invitation cannot reach protected content without
  inbox verification on a new browser;
- session fixation, cookie-attribute, CSRF, logout, idle-expiry, absolute-expiry,
  replacement, and revocation tests;
- authorization matrix tests across providers, clients, projects, stages,
  revisions, invoices, evidence, and actions;
- direct-object-reference and cross-project access tests;
- enumeration tests covering response content, status, and practical timing;
- tests proving viewing, link prefetching, and GET requests cannot record a
  decision;
- audit tests linking every decision to the principal, grant, session event,
  exact revision, display-name snapshot, and time;
- log scanning that detects forbidden credentials and sensitive URL values;
- monitoring for request and verification abuse, delivery failures, unusual
  session creation, authorization denials, and revocation failures; and
- security review against current OWASP authentication and session guidance
  before production release.

## Revisit triggers

A new ADR should reconsider this decision when:

- clients commonly participate in multiple concurrent StagePaid projects;
- permanent client accounts or organization membership become a validated need;
- legal, contractual, payment, or project-risk requirements demand stronger
  identity proofing, MFA, passkeys, or electronic signatures;
- mobile applications require a different secure session-credential exchange;
- enterprise customers require SSO, federation, or centralized revocation;
- observed email delivery or account-compromise risk makes this method unable to
  meet product security objectives; or
- accessibility and usability research demonstrates that the code flow excludes
  intended clients.

## Related decisions and documents

- [ADR-001: Start with a modular monolith](0001-modular-monolith.md)
- [ADR-006: Use private object storage with signed access](0006-private-object-storage.md)
- [ADR-007: Treat verified Stripe webhooks as payment authority](0007-stripe-webhook-payment-authority.md)
- [Client access](../product/client-access.md)
- [Client review](../product/client-review.md)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- GitHub issue #7: Record foundational architecture decisions
