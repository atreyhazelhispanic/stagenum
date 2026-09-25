# MVP Security, Privacy, and Data-Retention Baseline

**Status:** Proposed

**Last updated:** 2026-09-23

**Owners:** Stagenum security and privacy owner (initially the founder), with
module owners responsible for implementation

## Purpose

This baseline defines the minimum controls required before Stagenum stores real
client identities, job-site evidence, invoices, or payment events. It turns the
[MVP threat model](threat-model-v1.md) into data-handling rules and implementation
acceptance criteria.

These are minimums, not claims of certification or universal legal compliance.
Where law, contract, card-network rules, or jurisdiction determine an answer,
Stagenum obtains qualified advice before launch.

## Principles

1. Collect the least data needed for a documented workflow.
2. Authorize from current server-side relationships, never from possession of an
   identifier, URL, object key, or stale session alone.
3. Keep mutable working data separate from immutable business history.
4. Keep raw payment credentials outside Stagenum-controlled systems.
5. Treat files and external callbacks as hostile until validated.
6. Make privileged and consequential actions explicit, attributable, and
   idempotent.
7. Separate business audit records from operational and security logs.
8. Retain each data class only for a documented purpose; legal holds override
   ordinary deletion without creating indefinite default retention.
9. Prefer controls that a solo founder can operate, test, and recover reliably.
10. Fail closed for authorization and integrity; show an honest pending or
    unavailable state for external uncertainty.

The FTC advises businesses to avoid unnecessary collection and maintain a
written policy defining why information is kept, how it is secured, how long it
is retained, and how it is disposed. See [Start with Security](https://www.ftc.gov/business-guidance/resources/start-security-guide-business)
and [Protecting Personal Information](https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business).

## Data classification

| Class | Stagenum examples | Minimum handling |
| --- | --- | --- |
| Public | Published marketing, public policies, documentation intentionally released | Integrity controls; review before publication |
| Internal | Sanitized aggregate metrics, non-sensitive deployment metadata, synthetic fixtures | Authenticated workforce access; no customer content |
| Confidential | Names, business email, project descriptions, ordinary communications, non-sensitive support records | Encryption in transit/at rest, tenant authorization, minimized logs and analytics |
| Restricted | Home/job-site evidence and location, invitations, sessions, approvals, invoices, payment references, exports, audit/security records | Need-to-know access, explicit audit, private storage, strict retention/export rules |
| Critical secret | Session tokens, one-time codes before hashing, database/storage/email credentials, Stripe keys and webhook secrets, signing/encryption keys | Secret manager or transient memory only; never source/log/client; rotation and revocation plan |

Classification follows the highest-sensitivity element in a combined record.
Synthetic fixtures may resemble structure but must not contain copied production
values.

Stagenum does not intentionally collect special-category identity data, raw card
or bank credentials, Social Security numbers, government IDs, biometrics, or
continuous location in the MVP. If customer evidence incidentally contains
sensitive people or locations, it remains Restricted and subject to provider
responsibility, access controls, and removal workflows.

## Collection and permitted use

- Contact information supports invitations, project participation, required
  notices, and transaction records; no client marketing occurs without separate
  informed consent.
- Project and evidence content supports scope, completion, review, dispute
  context, invoice generation, and authorized export.
- Provider-business logos support optional invoice branding. Logo uploads are
  limited to validated PNG/JPEG assets, stored privately, and snapshotted on
  issued invoices; they are not sent to AI services in the MVP.
- Evidence uploads are bounded to 10 images per stage in the MVP. AI image
  interpretation and larger quotas are deferred to a separately authorized
  v2 subscription capability.
- Payment metadata is limited to Stripe identifiers, state, allowed masked
  display details, amounts, fees, disputes, and reconciliation references.
- Security telemetry is collected only for abuse prevention, investigation,
  recovery, and control verification. It is not added indiscriminately to the
  shared project timeline.
- Analytics receives event categories and coarse product measurements, not
  names, email addresses, free text, object keys, invoice contents, payment
  identifiers, invitation values, session identifiers, or evidence.
- Support access requires an identified case, reason, least-privilege path, and
  audit event. Routine impersonation is prohibited.

## Identity, session, and authorization baseline

### Provider access

- Use a mature authentication service or reviewed implementation; password
  policy and MFA details require a bounded identity decision before launch.
- Require MFA for production administration and provider owners before payment
  collection is enabled.
- Rotate session identifiers after authentication and privilege change.
- Provider sessions use Secure, HttpOnly, SameSite cookies, bounded idle and
  absolute lifetimes, logout, remote revocation, and current membership checks.
- Sensitive owner actions—payout/account changes, refund initiation, access
  administration, exports, and security changes—require recent authentication or
  an equivalent step-up control.

### Passwordless client access

Initial security defaults, subject to usability testing:

- invitation link: 7-day lifetime, replaceable and revocable;
- one-time code: 10-minute lifetime, single use, digest-only persistence;
- code entry: at most 5 failed attempts before invalidation;
- resend: at least 60 seconds between sends, with layered hourly limits;
- client session: 7-day idle and 30-day absolute lifetime; and
- high-impact action: current active grant, session, exact project/revision
  authorization, explicit confirmation, and immutable attribution.

Responses to invitation and code operations do not reveal whether arbitrary
emails or projects exist. Limits combine normalized-email digest, invitation,
session, network source, and system-wide budgets without relying on IP address
as identity. Recovery and replacement invalidate old credentials and associated
sessions as soon as practical.

Every protected query and command includes the current `provider_business_id`
and project scope. Repository methods do not accept an unscoped record ID for
tenant-owned data. Database composite relationships provide defense in depth.

OWASP recommends meaningless, unpredictable session identifiers, server-side
session meaning, cookie-based exchange rather than URL credentials, lifecycle
logging without raw tokens, and user-visible revocation capability. See the
[OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

## Application and browser controls

- TLS is required for every production page, API, callback, and storage transfer.
- State-changing endpoints reject GET and require authenticated POST or another
  appropriate non-safe method.
- Cookie-authenticated state changes implement same-site cookie policy plus
  Origin validation and CSRF protection appropriate to the framework.
- Validate type, format, length, range, state eligibility, and ownership on the
  server. Client validation is usability only.
- Use parameterized database operations and contextual output encoding.
- Establish a restrictive Content Security Policy compatible with required
  Stripe-hosted components; minimize third-party scripts on authenticated and
  payment pages.
- Set HSTS after domain and HTTPS readiness, `X-Content-Type-Options: nosniff`,
  an intentional referrer policy, frame restrictions, and restrictive
  permissions policy.
- Sensitive authenticated responses and signed-access responses use
  `Cache-Control: no-store` unless a documented, tested private-cache policy is
  safer for a specific resource.
- Errors expose a correlation identifier and safe recovery message, not stack
  traces, SQL, provider payloads, secrets, existence information, or private
  record content.
- Exports neutralize CSV formula injection and render untrusted text without
  executable HTML, scripts, remote resources, or dangerous document features.

## Upload and evidence controls

- MVP allowlist begins with the minimum research-supported image/document types;
  each added format requires parser and delivery review.
- Enforce per-file, per-project, per-user, and aggregate storage limits before
  issuing an upload grant.
- Generate opaque storage keys; retain a sanitized display filename separately.
- Upload only to private quarantine through a short-lived, object-specific,
  operation-specific grant.
- Verify completed size, digest, detected type, file signature, and expected key.
  Never trust the browser-provided MIME type or filename.
- Scan in an isolated worker with bounded CPU, memory, time, recursion, and
  decompression. The initial MVP rejects archives and executable/active content.
- An object is unavailable to ordinary users until validation succeeds. Failed,
  unknown, or timed-out scans remain quarantined.
- Image metadata stripping and safe re-encoding are evaluated before allowing
  inline display; original retention is an explicit product/privacy choice.
- Downloads are reauthorized against the current grant and project relationship.
  Signed URLs are single-object and expire in minutes, not days.
- Unknown or active formats download as attachments from a non-application
  origin with safe content type, `nosniff`, and content disposition.
- Scanner providers must not receive customer files unless their privacy,
  retention, regional, and subcontractor terms are accepted.

## Payments and webhooks

- Use Stripe-hosted Elements or Checkout so raw card and bank credentials do not
  pass through Stagenum servers, logs, analytics, support tooling, or storage.
- Store only required processor identifiers and approved masked display data.
- Read the raw webhook body, verify the endpoint-specific signature before
  parsing, enforce a reasonable timestamp tolerance, and reject failures.
- A unique processor account/event constraint and idempotent transaction make
  duplicate delivery harmless. Do not assume event ordering.
- Browser redirects and success displays are never payment authority.
- Reconciliation uses authenticated server retrieval and produces auditable
  corrections without overwriting financial history.
- Stripe and Stagenum secrets differ by environment and role and are independently
  rotatable. Live-mode credentials never enter preview or staging.

Stripe requires the unmodified request body for signature verification. See
[Stripe webhook signature guidance](https://docs.stripe.com/webhooks/signature).

## Secrets and environment controls

- Keep a versioned inventory naming each secret, owner, purpose, environments,
  consumers, rotation method, revocation method, and exposure impact—never the
  value itself.
- Inject deployed secrets at runtime from the platform secret manager. Local
  secrets live only in ignored files or a developer secret store.
- Use separate production identities for web, worker, migration, CI deployment,
  and human administration where the platform supports it.
- Grant only required database, bucket, queue, email, Stripe, and secret actions.
- CI from untrusted forks receives no production secrets. Workflow and dependency
  changes receive review.
- Enable repository and CI secret scanning before production credentials exist.
- Rotate immediately after suspected exposure; removing a value from the latest
  commit is not revocation.
- Redact before serialization so secrets do not enter log pipelines. Do not rely
  only on a downstream regex scrubber.

The [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
recommends centralized storage, least privilege, auditing, rotation, revocation,
and exclusion from logs and CI leakage.

## Logging, audit, monitoring, and alerting

### Never log or send to analytics

- Raw session, invitation, verification, CSRF, signed-URL, or password-reset tokens
- One-time codes or their reusable equivalents
- Database URLs, private keys, API keys, webhook secrets, or Authorization/Cookie headers
- Raw card/bank data or Stripe client secrets
- Evidence bytes, full filenames when sensitive, project free text, Change
  Request text, invoice line descriptions, or export contents
- Full email addresses, phone numbers, job-site addresses, or unnecessary IP/user-agent data
- Raw webhook bodies, database rows, or exception objects that may contain the above

Use internal identifiers, event categories, result codes, coarse network abuse
signals, byte counts, durations, release, environment, and salted/rotating
correlation digests where necessary.

### Required observable events

- Provider authentication success/failure, MFA and recovery changes, session
  creation/revocation, and privilege/membership changes
- Client invitation issue/replacement/revocation, code send/verify outcomes,
  rate limiting, grant/session creation, and revoked-session use
- Authorization denials and repeated cross-project or object-access attempts
- Upload grant, completion, validation, quarantine, malware result, download
  grant, deletion request, and unusual volume
- Stripe signature failure, unknown event, duplicate handling, webhook lag,
  reconciliation mismatch, refund/admin action, and idempotency conflict
- Export creation/download, support access, manual replay, migration, retention
  override, legal hold, backup/restore, and secret rotation
- Logging/monitoring failure, elevated error rate, queue age, dead jobs, storage
  policy failure, and backup freshness failure

Security logs are access-controlled separately from client-visible business
activity. OWASP identifies authentication, authorization, session, upload,
export, administrative, and suspicious business-flow events as important
application telemetry. See the [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).

## Retention and disposal schedule

Periods below are engineering/product defaults pending pre-launch legal and tax
review. “Delete” includes searchable primary copies and derived objects; encrypted
backup copies age out on the backup schedule and are not restored into active use
without reapplying deletion tombstones.

| Data class | Initial retention | Disposal/exception |
| --- | --- | --- |
| Issued invoices, corrections, payments, refunds, fees, disputes, payout/reconciliation references | Seven years after the later of final financial event or project closure | Extend for legal hold, dispute, tax, or counsel-directed obligation; immutable until eligible |
| Accepted agreements, submitted revisions, approvals, Change Requests, withdrawals, associated activity | Seven years after project closure for the U.S.-first MVP | Counsel must confirm contractual limitation periods and deletion rights |
| Evidence attached to retained submission or financial history | Align with the related project-record period only when necessary for agreement, dispute, or customer-selected record purpose | Permit earlier authorized deletion where no hold or record purpose remains; preserve metadata/tombstone as required |
| Mutable submission/invoice drafts | Active project plus 90 days after abandonment or project closure | Delete sooner on authorized request when no abuse, dispute, or record dependency exists |
| Pending unattached upload | 24 hours after grant expiry | Idempotent cleanup; retain only minimal failure metadata |
| Quarantined/rejected upload | Up to 30 days | Delete sooner when safe; extend only for documented security investigation or legal hold |
| Invitation and one-time-code secret material | Code digest through expiry plus at most 24 hours; invitation secret digest until expiry/revocation | Never retain raw code/link token; preserve non-secret business event separately |
| Client/provider session records | 30 days after expiry or revocation | Retain only minimized security event longer when justified |
| Routine operational application logs | 30 days searchable | No customer content or secrets; shorter where adequate |
| Security/authentication telemetry | 90 days searchable | Extend up to one year for high-risk signals or active incident; document purpose and access |
| Incident evidence | Incident duration plus a documented case-specific period | Security owner and counsel determine hold, notification, and disposal |
| Generated CSV/PDF export object | 24 hours after generation unless explicitly saved as a retained business document | Underlying records remain; download grant expires in minutes |
| Delivery-provider message metadata | 90 days or shorter provider minimum adequate for troubleshooting | Do not retain message content longer than required |
| Database backups and object versions | Target 35-day rolling recovery window initially | Provider capability and recovery objectives may adjust; reapply deletions after restore |
| Sanitized research synthesis | Indefinite while useful | Must not identify participant or customer |
| Raw research contact data, recordings, and identifiable notes | Only through consented research and verification, then delete within 90 days of synthesis | Store outside public repository; honor consent and withdrawal terms |

Retention jobs are idempotent, observable, and blocked by active legal hold,
open dispute, unresolved deletion failure, or required record relationship.
Deletion is reported complete only after primary records and objects reach their
defined terminal state. Storage lifecycle rules are defense in depth, not the
sole authority.

## Access, export, correction, and deletion

- Providers can export their authorized financial ledger and related documents;
  clients can export documents and history within their grants without provider
  costs or unrelated records.
- Reauthenticate consequential exports and generate them asynchronously. Record
  requester, scope, format, creation, download, expiry, and failure.
- Correct immutable business records through linked corrections. Do not satisfy
  a privacy request by falsifying invoice, approval, or payment history.
- Account closure revokes access and removes data without a remaining purpose,
  while retained records become access-restricted rather than silently deleted.
- A deletion request produces a record-class evaluation: identity verification,
  tenant/project authority, retention purpose, legal hold, processor/provider
  copies, backups, outcome, and appeal/contact path.
- Stagenum documents subprocessors and identifies which requests must also be
  propagated to them.

## Backup and recovery

- Encrypt backups and restrict backup/restore permission more tightly than
  ordinary application access.
- Enable managed point-in-time recovery before storing real Restricted records.
- Monitor backup freshness and failure; a configured backup without restoration
  evidence is not considered recoverable.
- Perform and document a staging restoration before launch and at least
  quarterly while production holds customer records.
- Restoration uses an isolated environment and validates schema version,
  record counts, immutable-history consistency, object relationships, outbox
  state, payment reconciliation, revoked credentials, and deletion tombstones.
- Recovery credentials and provider account recovery are stored so the incident
  owner can access them if the normal deployment path is unavailable.
- Recovery objectives are selected before launch based on affordable provider
  capabilities and stated honestly; this baseline does not invent an SLA.

## Incident response

The founder is the initial incident commander, security owner, privacy owner,
and external-provider coordinator. Before production, designate an emergency
delegate with access to the runbook and account-recovery process but not standing
access to all customer data.

Use this lifecycle, aligned with
[NIST SP 800-61 Rev. 3](https://csrc.nist.gov/pubs/sp/800/61/r3/final):

1. **Prepare:** inventory systems/data/providers, establish contacts, backups,
   logging, severity criteria, decision records, and tabletop exercises.
2. **Detect and assess:** preserve evidence, begin an incident timeline, classify
   affected assets/data/tenants, and distinguish suspicion from confirmation.
3. **Contain:** revoke sessions and grants, rotate secrets, stop signing or
   payment actions, quarantine objects, restrict support/admin paths, or disable
   affected capability without destroying evidence.
4. **Eradicate and recover:** patch root cause, restore from known-good artifacts,
   reconcile database/storage/Stripe state, reissue credentials, and monitor.
5. **Communicate:** coordinate provider, insurer, counsel, law enforcement, and
   affected-party notices according to applicable facts and deadlines. Do not
   make improvised legal conclusions.
6. **Learn:** document cause, scope, decisions, control gaps, costs, and owners;
   update this baseline, tests, retention, and runbooks.

### Minimum incident alerts

- Suspected secret or session-token exposure
- Repeated cross-tenant authorization denial or successful unauthorized access
- Malware detection or unsafe object made available
- Stripe signature failures above normal noise or financial reconciliation mismatch
- Unexpected export/support access or privilege change
- Backup/restore failure or destructive database/storage activity
- Production secret used from a non-production environment
- Security logging disabled, delayed, or tampered with
- Material dependency or provider compromise affecting Stagenum

## Questions reserved for qualified counsel or specialists

Before accepting real customers, obtain advice appropriate to Stagenum's actual
launch states, business structure, processor model, and data practices on:

- Privacy notice, contractual roles, consumer rights, subprocessors,
  cross-border transfers, and state-specific privacy applicability
- Security-incident and breach-notification triggers, deadlines, content, and
  coordination—including New Mexico and every state where affected people reside
- Contract, invoice, tax, dispute, and financial-record retention periods and
  legal-hold procedure
- Electronic agreement, attribution, evidence, and signature requirements
- Stripe Connect platform responsibilities, PCI attestation, refunds, disputes,
  money-transmission/payment-facilitation questions, and terms allocation
- Job-site photos containing people, homes, addresses, children, copyrighted
  material, or unlawful content; takedown and preservation obligations
- Marketing consent, transactional email classification, and suppression records
- Account closure, deletion, access, correction, and export obligations
- Whether cyber/privacy insurance, vendor contract terms, or a formal security
  assessment are appropriate before launch

Stagenum does not advertise legal compliance, certification, or guaranteed
evidentiary effect without substantiation.

## Implementation acceptance criteria

Issue #18 and later bounded implementation issues must demonstrate:

- [ ] Validated startup configuration rejects missing secrets without revealing them.
- [ ] Local, staging, and production credentials and data are isolated.
- [ ] Provider/admin MFA and session revocation are implemented before real payments.
- [ ] Client invitation, code, grant, and session limits match this baseline or a reviewed successor decision.
- [ ] Every protected repository/API path includes tenant, project, actor, and action authorization.
- [ ] GET, prefetch, or link preview cannot create approval or another business decision.
- [ ] CSRF, security headers, safe caching, error handling, and output encoding are tested.
- [ ] Upload allowlist, quotas, quarantine, type/signature validation, malware outcome, and safe delivery are tested.
- [ ] Object buckets are private and every signed operation is short-lived and scoped.
- [ ] Stripe-hosted collection is used; raw payment credentials cannot enter Stagenum.
- [ ] Webhook raw-body signature, duplicate, ordering, failure, and reconciliation tests pass.
- [ ] Secrets and restricted fields are absent from source, history, images, bundles, logs, analytics, fixtures, and CI artifacts.
- [ ] Business audit records are append-only and separate from operational logs.
- [ ] Required security events are centralized, access-controlled, alerted, and retained by class.
- [ ] Exports reauthorize scope, neutralize active content, expire, and create audit events.
- [ ] Retention/deletion jobs respect legal holds, report failure, and reconcile storage.
- [ ] Backup freshness is monitored and an isolated restoration/reconciliation exercise passes.
- [ ] A versioned incident runbook, provider contact list, severity rubric, and emergency delegate exist.
- [ ] Dependency, secret, static-analysis, and container checks have triage owners and remediation expectations.
- [ ] Pre-launch counsel/security review questions have decisions or documented launch blockers.

## Required follow-up issues

1. Implement provider and passwordless-client authentication/session controls.
2. Implement tenant/project authorization tests and scoped persistence adapters.
3. Implement the quarantined evidence-upload and safe-download pipeline.
4. Implement security headers, CSRF controls, rate limits, and safe error/logging middleware.
5. Implement Stripe-hosted collection, verified webhook ingestion, and reconciliation tests.
6. Implement secrets inventory, CI secret/dependency scanning, and rotation runbook.
7. Implement export controls and retention/deletion workers.
8. Configure encrypted backups and complete a restoration exercise.
9. Write and tabletop the incident-response runbook.
10. Complete pre-launch privacy, terms, payment, retention, and breach-response review with qualified counsel.

These may become separate issues when their dependency and implementation slice
is ready. They are not silently added to the synthetic prototype.

## Related documents

- [MVP threat model](threat-model-v1.md)
- [Initial system architecture](../architecture/initial-system-architecture.md)
- [Production domain model](../architecture/production-domain-model.md)
- [Client access](../product/client-access.md)
- [Invoice and payment states](../product/invoice-payment-states.md)
- [ADR-006: Private object storage](../adr/0006-private-object-storage.md)
- [ADR-007: Stripe webhook authority](../adr/0007-stripe-webhook-payment-authority.md)
- [ADR-008: Passwordless project access](../adr/0008-passwordless-project-scoped-access.md)
- [ADR-009: Runtime and deployment](../adr/0009-production-runtime-and-deployment.md)
