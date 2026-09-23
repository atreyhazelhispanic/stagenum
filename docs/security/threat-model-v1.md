# Stagenum MVP Threat Model

**Version:** 1.0

**Status:** Proposed

**Last updated:** 2026-09-23

**Owner:** Stagenum security owner (initially the founder)

## Purpose and review rule

This threat model identifies the assets, trust boundaries, abuse cases,
mitigations, accepted risks, and owners for the first production Stagenum MVP.
It applies before Stagenum accepts real identities, job-site evidence, invoices,
or payment events.

Review this model before launch and whenever Stagenum adds a new identity method,
file type, payment flow, administrative capability, external provider, native
client, AI/agent workflow, or materially different data class. Security events
and research findings may trigger an earlier review. A material change creates a
new version while preserving this document in history.

This model is an engineering baseline, not a certification or legal opinion.

## Scope

### Included

- Provider accounts, business membership, and sessions
- Passwordless, project-scoped client invitations, codes, grants, and sessions
- Projects, stages, submissions, approvals, Change Requests, and activity
- Direct evidence uploads, private object access, processing, and export
- Invoice snapshots, payment attempts, Stripe webhooks, and financial events
- Email delivery and callback handling
- Web/API and worker processes, PostgreSQL, object storage, and outbox jobs
- Administrative support, deployment, secrets, logs, backups, and recovery

### Excluded from this version

- Native mobile binaries and device-local offline storage
- AI or agent processing of customer data
- Enterprise SSO, organization administration, and delegated support teams
- GPS or continuous location tracking
- Formal compliance certification or penetration-test attestation

Those capabilities require a threat-model revision before production use.

## System and trust boundaries

The [system-container diagram](../architecture/diagrams/system-containers.mmd)
defines the primary data flow. Security-relevant trust boundaries are:

1. **Public client boundary:** browsers and future mobile clients are untrusted.
   All identifiers, state, files, headers, and action claims require server-side
   validation and authorization.
2. **Authentication boundary:** control of an email inbox establishes a limited
   client session, not global identity or ownership. Session possession is
   sensitive but does not itself authorize unrelated projects.
3. **Tenant and project boundary:** provider business, membership, project,
   stage, grant, and action scope are evaluated for every protected operation.
4. **Application/data boundary:** only application and worker identities reach
   PostgreSQL or private storage. Clients never receive database credentials or
   unrestricted storage credentials.
5. **File boundary:** every upload is hostile until size, type, signature,
   integrity, and malware policy have completed. Metadata is not proof of safety.
6. **Payment boundary:** raw card and bank credentials remain in Stripe-hosted
   surfaces. Browser success is not authoritative; verified server events are.
7. **External-provider boundary:** Stripe, email, storage, hosting, monitoring,
   and malware-scanning providers can fail, delay, duplicate, or expose data.
8. **Operator boundary:** support and production administration are separate
   from customer access, strongly authenticated, least-privileged, and audited.
9. **Environment boundary:** local, staging, and production have separate data,
   credentials, origins, signing secrets, buckets, and Stripe modes.
10. **Observability boundary:** operational telemetry is useful for detection but
    must not become a second, weakly protected customer-data store.

## Protected assets

| Asset | Primary harm if compromised | Classification | Owner |
| --- | --- | --- | --- |
| Provider account and membership | Account takeover; fraudulent project or refund actions | Restricted | Identity and access |
| Client invitation, code, grant, and session | Unauthorized project access or decision attribution | Restricted | Identity and access |
| Client/provider contact information | Privacy harm, phishing, unwanted marketing | Confidential | Identity and access |
| Project scope and communications | Commercial/privacy harm and dispute manipulation | Confidential | Projects and reviews |
| Job-site evidence and metadata | Home/location exposure, safety risks, private-content disclosure | Restricted | Evidence |
| Approvals and Change Requests | Forged consent or altered project history | Restricted business record | Reviews and audit |
| Issued invoices and financial events | Fraud, false balances, tax/contract record corruption | Restricted financial record | Billing and payments |
| Stripe identifiers and webhook secrets | Fraudulent event injection or account compromise | Restricted | Payments/platform |
| Application, database, storage, email, and signing secrets | Broad system compromise | Critical secret | Platform |
| Audit and security events | Loss of attribution or incident-detection capability | Restricted | Audit/security owner |
| Backups and exports | Bulk disclosure and durable copies outside ordinary controls | Restricted | Platform/data owner |
| Source and deployment pipeline | Supply-chain compromise and secret extraction | Restricted | Platform |

Stagenum does not collect raw card numbers, CVC values, bank credentials, Social
Security numbers, government identity documents, or biometric identifiers for
the MVP.

## Threat actors

- An unauthenticated opportunistic attacker
- A person holding a forwarded, stale, or intercepted invitation link
- A provider or client attempting access beyond their project or role
- A compromised provider email account or browser session
- A malicious uploader or an attacker exploiting a file parser
- A bot performing enumeration, credential stuffing, code guessing, or resource
  exhaustion
- A forged or replayed external webhook caller
- A compromised dependency, CI workflow, external provider, or service token
- An authorized operator misusing broad access or making an unsafe mistake
- A former user or contractor whose access was not revoked

## Abuse cases, controls, residual risk, and owners

| ID | Abuse case | Required mitigations | Residual/accepted risk | Owner |
| --- | --- | --- | --- | --- |
| TM-01 | Enumerate whether an email, invitation, project, or invoice exists | Uniform responses; opaque identifiers; bounded timing; per-IP, per-email-digest, and global rate limits; no sensitive URL parameters | Aggregate traffic patterns may still reveal broad service usage | Identity and access |
| TM-02 | Guess or replay a one-time code | Cryptographically random codes; digest-only storage; short expiry; single use; attempt limit; resend cooldown; invalidate earlier code; security telemetry | Compromised email inbox defeats email possession proof | Identity and access |
| TM-03 | Use a forwarded or stale invitation | Invitation alone cannot authenticate; verify through invited inbox; check current invitation, grant, session, project, and action on every request; revoke replacements | Recipient email compromise remains outside Stagenum's full control | Identity and access |
| TM-04 | Access another tenant or project by changing an ID | Tenant/project composite database relationships; scoped repository methods; server authorization; object authorization; cross-tenant tests | Application authorization defects remain possible and require testing | Application modules |
| TM-05 | Cause approval through a link preview, GET, prefetch, or CSRF | GET is read-only; explicit confirmation; POST command; same-site cookie; Origin/CSRF defense; exact-revision lock; one terminal decision | Malware controlling an authenticated browser can act as the user | Reviews |
| TM-06 | Hijack or fix a session | Server-generated high-entropy opaque token; digest at rest; Secure, HttpOnly, SameSite cookie; rotation after verification/privilege change; idle and absolute expiry; revocation; no token in URL or logs | Stolen active browser state remains usable until detection, expiry, or revocation | Identity and access |
| TM-07 | Upload malware, active content, oversized files, or parser exploits | Allowlisted MVP formats; bounded count and size; generated storage key; private quarantine; declared and detected type/signature checks; malware scan; sandboxed processing; safe download headers; no public bucket | No scanner detects every new malicious file; initially restrict formats and processing | Evidence/platform |
| TM-08 | Read evidence through guessed keys or leaked signed URLs | Opaque keys are not authorization; authorize current session/grant and object relationship before signing; single-object, operation-specific, short-lived URLs; private origin; no sensitive notification links | A valid signed URL can be used until its short expiry | Evidence |
| TM-09 | Forge, replay, duplicate, or reorder Stripe events | TLS; verify signature against raw body; endpoint-specific secret; timestamp tolerance; unique processor event ID; idempotent transaction; retrieve/reconcile from Stripe; do not trust browser result | Stripe outage delays final state; UI must show pending/unknown | Payments |
| TM-10 | Double charge or apply money twice | One active attempt per invoice; invoice lock; command and Stripe idempotency keys; immutable unique payment event; balance derived from events | Processor disputes and reversals remain possible and are represented separately | Payments |
| TM-11 | Expose card or bank credentials to Stagenum | Stripe-hosted Elements or Checkout; no raw credential fields, logging, analytics, support capture, or screenshots; CSP permits only required Stripe origins | PCI obligations remain shared and require launch review/attestation | Payments/security owner |
| TM-12 | Exfiltrate secrets from source, CI, logs, errors, or support tooling | Runtime secret manager; least-privilege service identities; environment separation; secret scanning; redaction; safe errors; rotation inventory; audited access; no production secrets in forks or previews | A runtime compromise may expose secrets available to that role | Platform |
| TM-13 | Abuse exports or support access for bulk disclosure | Reauthorize export; project/role filters; asynchronous generation; private short-lived download; export audit event; rate/size limits; operator reason and audit; no routine impersonation | Legitimate recipients can retain downloaded copies outside Stagenum | Audit/platform |
| TM-14 | Erase or rewrite business and financial history | Append-only records and triggers; linked corrections; least-privilege DB roles; backups and point-in-time recovery; audit administrative actions | Privileged infrastructure compromise can damage primary and backup systems | Data/platform |
| TM-15 | Exhaust email, verification, upload, processing, or payment resources | Layered rate limits, quotas, payload/time limits, queue bounds, retry caps, circuit breakers, budgets, maximum scaling, alerts | Distributed attacks may degrade availability despite limits | Platform |
| TM-16 | Inject sensitive or executable content into UI, logs, CSV, PDF, or notifications | Contextual output encoding; parameterized SQL; safe templates; CSV formula neutralization; content limits; sanitize filenames; log escaping; do not render untrusted active content inline | New rendering libraries can introduce parser risks | Application modules |
| TM-17 | Poison or suppress audit/security telemetry | Append-only business activity; centralized structured security logs; restricted log access; immutable provider retention where practical; alert on logging failure | A full platform compromise may affect telemetry completeness | Audit/security owner |
| TM-18 | Deploy vulnerable or malicious code/dependency | Locked dependencies; protected main branch; reviewed workflow changes; CI tests; dependency and secret scanning; immutable image provenance; prompt patching of critical issues | Zero-day dependency and provider compromise cannot be eliminated | Platform |
| TM-19 | Recover deleted data unintentionally from backup or lower environment | No production copies in local/staging; encrypted backups; bounded backup retention; restore access control; deletion tombstones reapplied after restore | Deleted records may remain inaccessible in backups until backup expiry | Data/platform |
| TM-20 | Solo-founder unavailability delays incident response | Written runbook, provider contacts, recovery credentials, domain/hosting account recovery, severity thresholds, and named emergency delegate before launch | Initial response capacity is limited until a qualified backup owner exists | Founder |

## Security assumptions

- Production hosting, PostgreSQL, object storage, email, Stripe, and monitoring
  providers meet their documented security and durability responsibilities.
- TLS is correctly configured at the public edge and between services where
  traffic crosses an untrusted network.
- Provider email account security and client inbox control are external
  dependencies; Stagenum still limits the authority granted after verification.
- The deployment platform supports least-privilege identities, secret injection,
  audit logs, backups, and rapid credential rotation.
- Time synchronization is reliable enough for expiry, webhook verification,
  ordering, and incident reconstruction.

An assumption that becomes false triggers reassessment rather than silent risk
acceptance.

## Accepted MVP risks

| Risk | Reason accepted now | Required boundary | Revisit trigger |
| --- | --- | --- | --- |
| Email possession is the client authentication factor | Lowest-friction validated client model | Project-scoped grant, limited session, revocation, explicit decisions | High-risk projects, account takeover, enterprise requirements, or research demands stronger proof |
| No claim of malware-free uploads | Perfect detection is impossible | Minimal allowlist, quarantine, scanning, safe delivery, no public execution | New file formats, automated extraction, or scanner failures |
| Single-region runtime | Early operational simplicity and cost | Tested backups, provider durability, recovery procedure | Service objectives or adoption justify multi-region recovery |
| Founder initially owns security and incidents | Current team size | Written runbook and emergency delegate before real data | Team growth, meaningful revenue, or response burden |
| Limited operational telemetry retention | Data minimization and cost | Sufficient window for likely detection; extend during incidents | Detection evidence shows incidents are found later |
| External processors and providers can delay outcomes | Cannot make distributed delivery synchronous | Explicit pending/unknown states, idempotency, reconciliation | Provider reliability misses service objectives |

No accepted risk permits cross-project access, storage of raw payment
credentials, silent financial-history mutation, or production secrets in source.

## Security verification strategy

Before real customer data:

- map applicable controls to the current [OWASP ASVS](https://owasp.org/projects/asvs/)
  and record test evidence rather than claiming compliance;
- test authorization across businesses, projects, stages, objects, exports, and
  administrative operations;
- test invitation enumeration, code replay/guessing, session fixation,
  revocation, CSRF, and read-only GET behavior;
- test upload polyglots, spoofed MIME types, oversized files, malware outcomes,
  quarantine, signed-URL expiry, and unsafe inline rendering;
- test Stripe signature failure, malformed raw bodies, duplicates, ordering,
  delayed delivery, and reconciliation;
- test secret absence from Git history, images, client bundles, logs, analytics,
  errors, fixtures, and exported artifacts;
- test append-only records, outbox atomicity, backup restoration, deletion
  tombstones, and recovery reconciliation; and
- run dependency, static-analysis, secret, and container-image checks in CI with
  triage ownership and bounded remediation times.

OWASP recommends defense in depth for uploads, including allowlisted formats,
server-generated filenames, size limits, type/signature validation, isolated
storage, authorization, and malware analysis. See the
[OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

Stripe states that low-risk hosted integrations keep sensitive payment details
from passing through the merchant server, while PCI responsibility remains
shared. See Stripe's [integration security guide](https://docs.stripe.com/security/guide)
and [Elements documentation](https://docs.stripe.com/payments/elements).

## Related documents

- [MVP security, privacy, and data-retention baseline](mvp-security-privacy-baseline.md)
- [Initial system architecture](../architecture/initial-system-architecture.md)
- [Production domain model](../architecture/production-domain-model.md)
- [ADR-006: Private object storage](../adr/0006-private-object-storage.md)
- [ADR-007: Stripe webhook authority](../adr/0007-stripe-webhook-payment-authority.md)
- [ADR-008: Passwordless project access](../adr/0008-passwordless-project-scoped-access.md)
- [ADR-009: Production runtime and deployment](../adr/0009-production-runtime-and-deployment.md)
