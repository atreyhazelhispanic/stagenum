# Evidence Feedback

**Status:** Draft

**Last updated:** 2026-09-13

## Objective

Let a client identify exactly which photo, file, link, checklist item, or other
submitted evidence needs attention without turning Stagenum into a general
commenting or collaboration platform.

## Decision

The MVP supports optional evidence-specific notes only as part of a **Change
Request**. Every Change Request still requires one overall message that explains
what the provider needs to address.

Evidence-specific notes add context to that message. They are not standalone
comments, conversation threads, approvals, or independent decisions.

This produces one structured client decision:

> **Change Request CR-001**
>
> Overall message + optional notes linked to specific evidence

## Why this boundary

One overall message alone may be ambiguous when a stage contains many photos,
files, or deliverables. Full comment threads would add notifications, reply
states, moderation, unread tracking, deletion rules, and another place for the
actual decision to become unclear.

Evidence-specific notes provide precision while keeping the Change Request as
the single source of truth.

## Client-facing flow

### 1. Start a Change Request

The client selects **Request changes** from the stage review. Stagenum opens the
Change Request form with the overall message field.

### 2. Add an evidence note

For any submitted evidence item, the client may select:

> **Add note to Change Request**

Stagenum shows the selected item and asks:

> What should **[provider name]** know about this item?

The note is required once the client chooses to add one. The client can edit or
remove it while the Change Request remains a draft.

### 3. Review the complete request

Before sending, Stagenum presents:

- the required overall message;
- every referenced evidence item;
- the note associated with each item; and
- the effect of submitting the Change Request.

The client can return to edit without losing the draft.

### 4. Send one decision

Selecting **Send request** records the overall message and all evidence notes as
one immutable Change Request event. Stagenum does not send a separate
notification for each note.

## Supported evidence references

The MVP may link notes to evidence that has a stable identity within the submitted
revision, including:

- photos;
- uploaded files;
- external deliverable links;
- checklist items; and
- provider-written evidence entries.

The note references the exact evidence version presented to the client. Replacing
or editing evidence later does not retarget the note to a different item.

## Provider experience

The provider sees:

- the Change Request identifier;
- the client's overall message first;
- referenced evidence in submission order;
- each client note beside its evidence item; and
- one action area for responding to the Change Request.

The provider does not reply in a separate thread beneath every note. When
resubmitting, the provider supplies one response summary and may indicate how
each referenced item was addressed.

## Relationship to approval

Evidence notes are available only when requesting changes. The MVP does not allow
a client to approve a stage while leaving unresolved evidence notes.

Positive feedback, general discussion, and questions that do not block approval
may occur outside the evidence-note workflow until discovery demonstrates a need
for an additional product concept.

Viewing evidence, adding a draft note, or abandoning a draft never changes the
stage state. Only sending the complete Change Request records a decision.

## Relationship to scope changes

An evidence note may describe new or expanded work, but it does not modify scope,
price, schedule, or acceptance criteria. The provider may identify the note as a
potential scope change and use the separate scope-change workflow.

Evidence notes do not determine whether requested work is contractually included.

## Recorded data

Each evidence note stored within a Change Request includes at least:

- Change Request identifier;
- submitted revision identifier;
- evidence item identifier and evidence version;
- client-authored note text;
- note order; and
- the client identity and timestamp inherited from the Change Request event.

Evidence notes become immutable when the Change Request is sent. Later
clarification creates a new recorded event rather than rewriting the original
note.

## Failure behavior

- Draft notes are preserved when safe if validation or submission fails.
- Removing a note from the draft does not remove its evidence item from the
  submitted revision.
- If referenced evidence becomes unavailable before the request is sent,
  Stagenum stops submission and explains what changed.
- Retrying the Change Request cannot create duplicate notes or events.
- A provider withdrawal or concurrent client decision follows the same
  first-durable-event-wins rule as the parent Change Request.

## Accessibility and content handling

- Evidence controls have descriptive labels beyond icons or color.
- The client can understand which item a note references without relying on its
  visual position alone.
- File names, captions, and alternative text remain available to assistive
  technology.
- Note validation identifies the affected evidence item clearly.
- Stagenum treats note text and referenced evidence as sensitive project data.
- Notifications do not reproduce sensitive evidence or every note by default.

## MVP boundary

### Included

- One required overall Change Request message
- Optional notes linked to individual evidence items
- Draft editing and removal before submission
- One confirmation for the complete Change Request
- One notification event for the complete Change Request
- Immutable notes after submission
- Evidence references preserved across resubmission history
- One provider response summary

### Deferred

- Standalone evidence comments outside a Change Request
- Threaded replies
- Mentions, reactions, and resolved-comment controls
- Freehand photo or document markup
- Region, timestamp, or line-level annotations
- Real-time co-review
- Provider-initiated client questions on evidence
- Editing or deleting notes after submission
- Separate notifications for individual evidence notes

## MVP acceptance criteria

- A Change Request always includes one non-empty overall message.
- The client can optionally associate a non-empty note with a specific evidence
  item.
- The confirmation shows the overall message and all evidence notes together.
- Sending creates one Change Request decision and one notification event.
- Every note remains linked to the exact submitted evidence version reviewed.
- Draft notes alone never change stage state.
- Submitted notes cannot be silently edited, deleted, or retargeted.
- The provider can understand the overall request before reviewing item-level
  details.
- Evidence notes do not create independent approval, scope, invoice, or payment
  states.

## Remaining decisions

1. Which evidence types need thumbnails or previews in the confirmation?
2. Should a provider mark individual notes addressed when resubmitting, or is the
   response summary sufficient?
3. What limits apply to note length and the number of referenced items?
4. How should Stagenum handle an external link whose contents change outside the
   platform?
