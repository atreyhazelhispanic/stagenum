# Client Access

**Status:** Accepted for MVP

**Last updated:** 2026-09-13

## Decision

StagePaid clients can review project stages without creating a permanent
account. Access uses a secure email invitation followed by a one-time email code
on first access from a new browser or device. Successful verification establishes
a time-limited client session.

Before recording their first approval or request for changes, the client must
enter or confirm the display name that will appear in the shared project record.

## Goals

- Make client participation easier than adopting a project-management tool.
- Provide reasonable confidence that a decision came from the invited client.
- Protect project details from casual access if an invitation link is forwarded.
- Create an understandable record of who reviewed and acted on a submission.
- Allow clients to return during a project without repeatedly starting over.

## Non-goals

- Proving a person's legal identity
- Providing a formal electronic-signature service
- Replacing contract-specific identity or witness requirements
- Supporting passwords, social login, or permanent client accounts in the MVP
- Preventing access when the invited email account itself has been compromised
- Using an invoice amount alone to determine authentication requirements

## Roles

### Service provider

The provider chooses the client's email address when inviting the client to a
project. The provider may resend, replace, or revoke access, but cannot verify or
act as the client.

### Client

The client controls the invited email address, completes verification, confirms
the name associated with their decisions, and reviews only the projects and
stages made available through that invitation.

## First-access flow

1. The provider submits a stage for review.
2. StagePaid emails the invited client with the provider name, project, stage,
   and reason for the message.
3. The client opens the unique review link.
4. StagePaid explains that a one-time code will be sent to the invited email
   address.
5. The client requests the code.
6. StagePaid sends a short-lived, single-use code.
7. The client enters the code.
8. StagePaid establishes a time-limited session scoped to that client's project
   access.
9. The client enters or confirms a display name before making their first
   decision.
10. The client proceeds to the stage review experience.

The interface may mask the destination address when confirming code delivery,
provided the client can still recognize it.

## Returning-client flow

If a valid client session exists in the browser, an active invitation link opens
the authorized review experience without another code. StagePaid requests a new
code when the session is absent, expired, revoked, or otherwise invalid.

A client who later manages several StagePaid projects may be offered an optional
account in a future release. The MVP should not pressure the client to register
before or after making a decision.

## Display name

The display-name prompt should explain where the name will appear. It is an
attribution label supplied by the client, not verified government identity.

The confirmed name is stored with each approval or request for changes. Changing
the current display name must not rewrite names stored on earlier events.

## Invitation behavior

An invitation is:

- issued to one normalized email address;
- associated with a provider-client relationship and authorized project scope;
- represented by a high-entropy, non-guessable token;
- replaceable and revocable by the provider;
- invalidated when replaced or revoked; and
- prevented from exposing credentials or sensitive details in ordinary URLs and
  logs.

Forwarding the invitation alone should not be sufficient to complete first
access because the one-time code is delivered separately to the invited email
address.

#### Access scope

Successful verification grants only the access intended for that client. It
must not allow discovery of unrelated providers, clients, projects, stages, or
administrative information.

Authorization is enforced for every protected operation, not only when the
client first opens the page.

## Expiration and recovery

The product must support separate lifetimes for:

- invitation links;
- one-time verification codes; and
- verified browser sessions.

Exact durations remain an implementation and usability decision. The desired
behavior is:

- codes expire quickly and cannot be reused;
- sessions last long enough to support realistic review without repeated
  interruption;
- inactive or unusually old invitations require renewal;
- an expired-link page can request a replacement safely; and
- recovery does not reveal whether arbitrary email addresses or projects exist.

## Resend, replacement, and revocation

The provider can:

- resend an active invitation;
- replace an invitation after correcting a client email address; and
- revoke a client's future access.

Resending the same active invitation does not create duplicate client records.
Replacing or revoking access invalidates prior invitation links and sessions as
soon as practical. These actions are recorded in the project activity history.

Revoking future access does not erase decisions the client previously made.

## Decision authorization

A verified session is required to:

- approve a stage;
- request changes;
- submit a requested-change message; or
- perform any later client action that changes project state.

StagePaid should require an explicit confirmation before recording a decision.
Possession of a valid session does not turn navigation, inactivity, or viewing
into approval.

## Client-facing states

- **Verification required:** The invitation is recognized, but no valid session
  exists.
- **Code sent:** A code was requested recently; entry and resend controls are
  available.
- **Code invalid or expired:** The code cannot be accepted; the client can request
  another without losing context.
- **Verified:** A valid session exists and authorized content can be reviewed.
- **Invitation expired:** The invitation must be renewed before verification.
- **Access replaced:** A newer invitation exists and the client should use it or
  request another.
- **Access revoked:** The invitation can no longer be used; the client is directed
  to contact the provider.
- **Rate limited:** Further attempts are temporarily unavailable, with a helpful
  recovery message that does not disclose security details.

## Audit record

The shared project history may show:

- invited client email address in an appropriately masked or role-appropriate
  form;
- confirmed display name;
- invitation, resend, replacement, and revocation events;
- verification completion time;
- stage-view and decision events useful to both parties; and
- the specific submission revision associated with a decision.

Security telemetry such as network address, device signals, failed-code details,
and abuse indicators is internal. Its collection, access, retention, and deletion
must follow a documented privacy policy and should be limited to what StagePaid
actually needs.

## Abuse and privacy requirements

- Rate-limit code requests and verification attempts.
- Do not reveal whether an arbitrary email address has a StagePaid relationship.
- Never place one-time codes or authenticated session credentials in analytics.
- Avoid sending sensitive project evidence in notification emails.
- Provide a clear path for a recipient who received an invitation in error.
- Do not use client contact information for marketing without separate, informed
  consent.
- Treat email content, names, files, and project activity as sensitive customer
  data.

## MVP acceptance criteria

- A first-time client can reach an invited stage without creating an account.
- A forwarded invitation cannot complete first access without access to the
  invited email inbox.
- Codes are short-lived, single-use, and protected against repeated guessing.
- A successful code establishes a limited, expiring session.
- A returning client with a valid session does not need another code.
- The client confirms a display name before their first recorded decision.
- Every decision is attributable to a client identity, session, submission
  revision, and timestamp.
- Replacing or revoking access prevents continued use of older credentials.
- Prior decisions remain in history after access is revoked.
- Expiration and verification failures provide safe, understandable recovery.

## Decisions deferred to architecture and usability testing

1. Invitation, code, and session lifetimes
2. Session-cookie and token implementation
3. Code format, attempt limits, and resend cooldowns
4. Whether passive stage viewing appears in the shared history
5. Whether particularly sensitive projects require additional verification
6. Client access across multiple concurrent projects
7. Data-retention periods for internal security telemetry
