BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = clock_timestamp();
  RETURN NEW;
END;
$$;

CREATE FUNCTION reject_immutable_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only; create a linked correction record', TG_TABLE_NAME
    USING ERRCODE = '55000';
END;
$$;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  normalized_email text NOT NULL,
  display_name text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disabled', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (normalized_email),
  CHECK (normalized_email = lower(normalized_email))
);

CREATE TABLE provider_businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  default_currency char(3) NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (default_currency = upper(default_currency))
);

CREATE TABLE business_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL REFERENCES provider_businesses(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('invited', 'active', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, user_id),
  UNIQUE (provider_business_id, id)
);

CREATE TABLE client_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL REFERENCES provider_businesses(id),
  display_name text NOT NULL,
  email text NOT NULL,
  normalized_email text NOT NULL,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, normalized_email),
  UNIQUE (provider_business_id, id),
  CHECK (normalized_email = lower(normalized_email))
);

CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL REFERENCES provider_businesses(id),
  client_contact_id uuid NOT NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  lifecycle_state text NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_state IN (
      'draft', 'awaiting_client_acceptance', 'active', 'completed',
      'cancelled', 'closed', 'archived'
    )),
  currency char(3) NOT NULL,
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  closed_at timestamptz,
  archived_at timestamptz,
  created_by_membership_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, id),
  FOREIGN KEY (provider_business_id, client_contact_id)
    REFERENCES client_contacts(provider_business_id, id),
  FOREIGN KEY (provider_business_id, created_by_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  CHECK (currency = upper(currency))
);

CREATE TABLE stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  position integer NOT NULL CHECK (position > 0),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  acceptance_criteria text NOT NULL,
  agreed_amount_minor bigint NOT NULL CHECK (agreed_amount_minor >= 0),
  currency char(3) NOT NULL,
  work_state text NOT NULL DEFAULT 'planned'
    CHECK (work_state IN (
      'planned', 'in_progress', 'ready_to_submit', 'under_review',
      'rework_needed', 'approved', 'cancelled'
    )),
  expected_start_on date,
  expected_complete_on date,
  started_at timestamptz,
  approved_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, position),
  UNIQUE (provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id)
    REFERENCES projects(provider_business_id, id),
  CHECK (currency = upper(currency))
);

CREATE TABLE client_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  client_contact_id uuid NOT NULL,
  token_digest bytea NOT NULL UNIQUE,
  code_digest bytea,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'expired', 'revoked')),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  revoked_at timestamptz,
  created_by_membership_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id)
    REFERENCES projects(provider_business_id, id),
  FOREIGN KEY (provider_business_id, client_contact_id)
    REFERENCES client_contacts(provider_business_id, id),
  FOREIGN KEY (provider_business_id, created_by_membership_id)
    REFERENCES business_memberships(provider_business_id, id)
);

CREATE TABLE client_project_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  client_contact_id uuid NOT NULL,
  invitation_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked', 'expired')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  UNIQUE (provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id)
    REFERENCES projects(provider_business_id, id),
  FOREIGN KEY (provider_business_id, client_contact_id)
    REFERENCES client_contacts(provider_business_id, id),
  FOREIGN KEY (provider_business_id, project_id, invitation_id)
    REFERENCES client_invitations(provider_business_id, project_id, id)
);

CREATE TABLE client_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  client_project_grant_id uuid NOT NULL,
  session_token_digest bytea NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (provider_business_id, project_id, client_project_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id)
);

CREATE TABLE submission_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  completion_summary text NOT NULL DEFAULT '',
  provider_note text NOT NULL DEFAULT '',
  edited_by_membership_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id),
  UNIQUE (provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id)
    REFERENCES stages(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, edited_by_membership_id)
    REFERENCES business_memberships(provider_business_id, id)
);

CREATE TABLE submission_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  revision_number integer NOT NULL CHECK (revision_number > 0),
  completion_summary text NOT NULL,
  provider_note text NOT NULL DEFAULT '',
  stage_title_snapshot text NOT NULL,
  acceptance_criteria_snapshot text NOT NULL,
  agreed_amount_minor_snapshot bigint NOT NULL
    CHECK (agreed_amount_minor_snapshot >= 0),
  currency char(3) NOT NULL,
  responds_to_change_request_id uuid,
  submitted_by_membership_id uuid NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id, revision_number),
  UNIQUE (provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id)
    REFERENCES stages(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, submitted_by_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  CHECK (currency = upper(currency))
);

CREATE TABLE active_stage_reviews (
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid PRIMARY KEY,
  submission_revision_id uuid NOT NULL UNIQUE,
  opened_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (provider_business_id, project_id, stage_id)
    REFERENCES stages(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, submission_revision_id)
    REFERENCES submission_revisions(provider_business_id, project_id, stage_id, id)
);

CREATE TABLE submission_terminal_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  submission_revision_id uuid NOT NULL UNIQUE,
  decision_type text NOT NULL
    CHECK (decision_type IN ('approved', 'change_requested', 'withdrawn')),
  actor_membership_id uuid,
  actor_client_grant_id uuid,
  actor_display_name_snapshot text NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, submission_revision_id)
    REFERENCES submission_revisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, actor_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  FOREIGN KEY (provider_business_id, project_id, actor_client_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id),
  CHECK (num_nonnulls(actor_membership_id, actor_client_grant_id) = 1),
  CHECK (
    (decision_type = 'withdrawn' AND actor_membership_id IS NOT NULL)
    OR (decision_type IN ('approved', 'change_requested') AND actor_client_grant_id IS NOT NULL)
  )
);

CREATE TABLE approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  submission_revision_id uuid NOT NULL UNIQUE,
  terminal_decision_id uuid NOT NULL UNIQUE,
  client_project_grant_id uuid NOT NULL,
  approved_at timestamptz NOT NULL,
  UNIQUE (provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, submission_revision_id)
    REFERENCES submission_revisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, terminal_decision_id)
    REFERENCES submission_terminal_decisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, client_project_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id)
);

CREATE TABLE change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  submission_revision_id uuid NOT NULL UNIQUE,
  terminal_decision_id uuid NOT NULL UNIQUE,
  client_project_grant_id uuid NOT NULL,
  request_number integer NOT NULL CHECK (request_number > 0),
  message text NOT NULL CHECK (length(btrim(message)) > 0),
  requested_at timestamptz NOT NULL,
  UNIQUE (stage_id, request_number),
  UNIQUE (provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, submission_revision_id)
    REFERENCES submission_revisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, terminal_decision_id)
    REFERENCES submission_terminal_decisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, client_project_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id)
);

ALTER TABLE submission_revisions
  ADD CONSTRAINT submission_revisions_change_request_fk
  FOREIGN KEY (provider_business_id, project_id, stage_id, responds_to_change_request_id)
  REFERENCES change_requests(provider_business_id, project_id, stage_id, id);

CREATE TABLE change_request_evidence_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  change_request_id uuid NOT NULL,
  evidence_object_id uuid NOT NULL,
  note text NOT NULL CHECK (length(btrim(note)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE change_request_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  change_request_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'clarification_requested', 'clarification_added', 'being_addressed',
    'scope_change_proposed', 'scope_change_declined', 'scope_change_withdrawn',
    'response_submitted', 'resolved', 'closed_by_cancellation'
  )),
  message text,
  response_submission_revision_id uuid,
  actor_membership_id uuid,
  actor_client_grant_id uuid,
  actor_display_name_snapshot text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, change_request_id)
    REFERENCES change_requests(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, response_submission_revision_id)
    REFERENCES submission_revisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, actor_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  FOREIGN KEY (provider_business_id, project_id, actor_client_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id),
  CHECK (num_nonnulls(actor_membership_id, actor_client_grant_id) = 1)
);

CREATE TABLE submission_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  submission_revision_id uuid NOT NULL UNIQUE,
  terminal_decision_id uuid NOT NULL UNIQUE,
  withdrawn_by_membership_id uuid NOT NULL,
  explanation text NOT NULL CHECK (length(btrim(explanation)) > 0),
  withdrawn_at timestamptz NOT NULL,
  UNIQUE (provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, submission_revision_id)
    REFERENCES submission_revisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, terminal_decision_id)
    REFERENCES submission_terminal_decisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, withdrawn_by_membership_id)
    REFERENCES business_memberships(provider_business_id, id)
);

CREATE TABLE evidence_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid,
  storage_key text NOT NULL,
  display_filename text NOT NULL,
  declared_media_type text NOT NULL,
  detected_media_type text,
  byte_size bigint CHECK (byte_size >= 0),
  sha256_digest bytea,
  lifecycle_state text NOT NULL DEFAULT 'pending_upload'
    CHECK (lifecycle_state IN (
      'pending_upload', 'uploaded', 'validating', 'available', 'quarantined',
      'deletion_pending', 'deleted', 'expired'
    )),
  visibility text NOT NULL DEFAULT 'project_participants'
    CHECK (visibility IN ('provider_only', 'project_participants')),
  created_by_membership_id uuid,
  created_by_client_grant_id uuid,
  uploaded_at timestamptz,
  available_at timestamptz,
  expires_at timestamptz,
  retain_until date,
  legal_hold_at timestamptz,
  deleted_at timestamptz,
  replaced_object_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, storage_key),
  UNIQUE (provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id)
    REFERENCES projects(provider_business_id, id),
  FOREIGN KEY (provider_business_id, created_by_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  FOREIGN KEY (provider_business_id, project_id, created_by_client_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, replaced_object_id)
    REFERENCES evidence_objects(provider_business_id, project_id, id),
  CHECK (num_nonnulls(created_by_membership_id, created_by_client_grant_id) = 1)
);

ALTER TABLE change_request_evidence_notes
  ADD CONSTRAINT change_request_evidence_notes_request_fk
  FOREIGN KEY (provider_business_id, project_id, stage_id, change_request_id)
  REFERENCES change_requests(provider_business_id, project_id, stage_id, id),
  ADD CONSTRAINT change_request_evidence_notes_object_fk
  FOREIGN KEY (provider_business_id, project_id, evidence_object_id)
  REFERENCES evidence_objects(provider_business_id, project_id, id);

CREATE TABLE submission_draft_evidence (
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  submission_draft_id uuid NOT NULL,
  evidence_object_id uuid NOT NULL,
  position integer NOT NULL CHECK (position > 0),
  caption text NOT NULL DEFAULT '',
  PRIMARY KEY (submission_draft_id, evidence_object_id),
  UNIQUE (submission_draft_id, position),
  FOREIGN KEY (provider_business_id, project_id, stage_id, submission_draft_id)
    REFERENCES submission_drafts(provider_business_id, project_id, stage_id, id)
    ON DELETE CASCADE,
  FOREIGN KEY (provider_business_id, project_id, evidence_object_id)
    REFERENCES evidence_objects(provider_business_id, project_id, id)
);

CREATE TABLE submission_revision_evidence (
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  submission_revision_id uuid NOT NULL,
  evidence_object_id uuid NOT NULL,
  position integer NOT NULL CHECK (position > 0),
  caption_snapshot text NOT NULL DEFAULT '',
  PRIMARY KEY (submission_revision_id, evidence_object_id),
  UNIQUE (submission_revision_id, position),
  FOREIGN KEY (provider_business_id, project_id, stage_id, submission_revision_id)
    REFERENCES submission_revisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, evidence_object_id)
    REFERENCES evidence_objects(provider_business_id, project_id, id)
);

CREATE TABLE evidence_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  submission_revision_id uuid,
  evidence_object_id uuid NOT NULL,
  body text NOT NULL CHECK (length(btrim(body)) > 0),
  actor_membership_id uuid,
  actor_client_grant_id uuid,
  actor_display_name_snapshot text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id)
    REFERENCES stages(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, submission_revision_id)
    REFERENCES submission_revisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, evidence_object_id)
    REFERENCES evidence_objects(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, actor_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  FOREIGN KEY (provider_business_id, project_id, actor_client_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id),
  CHECK (num_nonnulls(actor_membership_id, actor_client_grant_id) = 1)
);

CREATE TABLE invoice_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  approval_id uuid NOT NULL UNIQUE,
  currency char(3) NOT NULL,
  due_on date,
  provider_note text NOT NULL DEFAULT '',
  total_minor bigint NOT NULL DEFAULT 0 CHECK (total_minor >= 0),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'abandoned', 'issued')),
  edited_by_membership_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, approval_id)
    REFERENCES approvals(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, edited_by_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  CHECK (currency = upper(currency))
);

CREATE TABLE invoice_draft_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_draft_id uuid NOT NULL REFERENCES invoice_drafts(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  description text NOT NULL,
  quantity numeric(12, 3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount_minor bigint NOT NULL CHECK (unit_amount_minor >= 0),
  line_total_minor bigint NOT NULL CHECK (line_total_minor >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (invoice_draft_id, position)
);

CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid NOT NULL,
  approval_id uuid NOT NULL UNIQUE,
  submission_revision_id uuid NOT NULL,
  invoice_draft_id uuid NOT NULL UNIQUE,
  invoice_number text NOT NULL,
  provider_name_snapshot text NOT NULL,
  provider_address_snapshot text NOT NULL,
  client_name_snapshot text NOT NULL,
  client_email_snapshot text NOT NULL,
  stage_title_snapshot text NOT NULL,
  currency char(3) NOT NULL,
  subtotal_minor bigint NOT NULL CHECK (subtotal_minor >= 0),
  total_minor bigint NOT NULL CHECK (total_minor > 0),
  due_on date,
  provider_note_snapshot text NOT NULL DEFAULT '',
  replaces_invoice_id uuid,
  issued_by_membership_id uuid NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  retain_until date NOT NULL,
  legal_hold_at timestamptz,
  UNIQUE (provider_business_id, invoice_number),
  UNIQUE (provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, approval_id)
    REFERENCES approvals(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, submission_revision_id)
    REFERENCES submission_revisions(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, stage_id, invoice_draft_id)
    REFERENCES invoice_drafts(provider_business_id, project_id, stage_id, id),
  FOREIGN KEY (provider_business_id, project_id, replaces_invoice_id)
    REFERENCES invoices(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, issued_by_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  CHECK (currency = upper(currency)),
  CHECK (replaces_invoice_id IS NULL OR replaces_invoice_id <> id)
);

CREATE TABLE invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  position integer NOT NULL CHECK (position > 0),
  description_snapshot text NOT NULL,
  quantity numeric(12, 3) NOT NULL CHECK (quantity > 0),
  unit_amount_minor bigint NOT NULL CHECK (unit_amount_minor >= 0),
  line_total_minor bigint NOT NULL CHECK (line_total_minor >= 0),
  UNIQUE (invoice_id, position)
);

CREATE TABLE invoice_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  source_invoice_id uuid NOT NULL,
  correction_type text NOT NULL CHECK (correction_type IN ('void', 'replace')),
  reason text NOT NULL CHECK (length(btrim(reason)) > 0),
  replacement_invoice_id uuid,
  actor_membership_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_invoice_id),
  UNIQUE (replacement_invoice_id),
  UNIQUE (provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, source_invoice_id)
    REFERENCES invoices(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, replacement_invoice_id)
    REFERENCES invoices(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, actor_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  CHECK (
    (correction_type = 'void' AND replacement_invoice_id IS NULL)
    OR (correction_type = 'replace' AND replacement_invoice_id IS NOT NULL)
  )
);

CREATE TABLE payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  processor text NOT NULL CHECK (processor IN ('stripe')),
  processor_account_id text NOT NULL,
  processor_attempt_id text,
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN (
      'created', 'requires_action', 'processing', 'submitted', 'failed',
      'cancelled', 'succeeded'
    )),
  requested_amount_minor bigint NOT NULL CHECK (requested_amount_minor > 0),
  currency char(3) NOT NULL,
  client_project_grant_id uuid NOT NULL,
  failure_code text,
  failure_summary text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, idempotency_key),
  UNIQUE (processor, processor_account_id, processor_attempt_id),
  UNIQUE (provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, invoice_id)
    REFERENCES invoices(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, client_project_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id),
  CHECK (currency = upper(currency))
);

CREATE TABLE refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  originating_payment_event_id uuid NOT NULL,
  idempotency_key text NOT NULL,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'submitted', 'succeeded', 'failed', 'cancelled')),
  processor_refund_id text,
  requested_by_membership_id uuid NOT NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, idempotency_key),
  UNIQUE (provider_business_id, project_id, id),
  CHECK (currency = upper(currency))
);

CREATE TABLE payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  payment_attempt_id uuid,
  refund_request_id uuid,
  originating_payment_event_id uuid,
  event_type text NOT NULL CHECK (event_type IN (
    'payment_succeeded', 'external_payment_recorded', 'refund_succeeded',
    'payment_reversed', 'dispute_opened', 'dispute_lost',
    'dispute_won', 'dispute_reversed'
  )),
  source text NOT NULL CHECK (source IN ('stripe_webhook', 'provider_recorded')),
  processor text,
  processor_account_id text,
  processor_event_id text,
  processor_object_id text,
  amount_minor bigint NOT NULL CHECK (amount_minor > 0),
  currency char(3) NOT NULL,
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  signature_verified_at timestamptz,
  actor_membership_id uuid,
  actor_client_grant_id uuid,
  processor_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  retain_until date NOT NULL,
  legal_hold_at timestamptz,
  UNIQUE (processor, processor_account_id, processor_event_id),
  UNIQUE (provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, invoice_id)
    REFERENCES invoices(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, payment_attempt_id)
    REFERENCES payment_attempts(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, refund_request_id)
    REFERENCES refund_requests(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, originating_payment_event_id)
    REFERENCES payment_events(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, actor_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  FOREIGN KEY (provider_business_id, project_id, actor_client_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id),
  CHECK (currency = upper(currency)),
  CHECK (jsonb_typeof(processor_details) = 'object'),
  CHECK (
    (source = 'stripe_webhook' AND processor = 'stripe'
      AND processor_event_id IS NOT NULL AND signature_verified_at IS NOT NULL)
    OR (source = 'provider_recorded' AND actor_membership_id IS NOT NULL)
  ),
  CHECK (
    (event_type IN ('payment_succeeded', 'external_payment_recorded')
      AND originating_payment_event_id IS NULL)
    OR (event_type NOT IN ('payment_succeeded', 'external_payment_recorded')
      AND originating_payment_event_id IS NOT NULL)
  )
);

ALTER TABLE refund_requests
  ADD CONSTRAINT refund_requests_invoice_fk
  FOREIGN KEY (provider_business_id, project_id, invoice_id)
  REFERENCES invoices(provider_business_id, project_id, id),
  ADD CONSTRAINT refund_requests_origin_fk
  FOREIGN KEY (provider_business_id, project_id, originating_payment_event_id)
  REFERENCES payment_events(provider_business_id, project_id, id),
  ADD CONSTRAINT refund_requests_actor_fk
  FOREIGN KEY (provider_business_id, requested_by_membership_id)
  REFERENCES business_memberships(provider_business_id, id);

CREATE TABLE payment_event_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  payment_event_id uuid NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN (
    'client_applied', 'client_returned', 'processor_fee',
    'stagenum_fee', 'stagenum_fee_return', 'provider_net',
    'provider_adjustment', 'settlement'
  )),
  amount_minor bigint NOT NULL,
  currency char(3) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payment_event_id, entry_type),
  FOREIGN KEY (provider_business_id, project_id, payment_event_id)
    REFERENCES payment_events(provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id, invoice_id)
    REFERENCES invoices(provider_business_id, project_id, id),
  CHECK (currency = upper(currency)),
  CHECK (amount_minor <> 0)
);

CREATE TABLE command_idempotency (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL REFERENCES provider_businesses(id),
  scope text NOT NULL,
  idempotency_key text NOT NULL,
  request_fingerprint bytea NOT NULL,
  status text NOT NULL CHECK (status IN ('processing', 'succeeded', 'failed')),
  response_reference jsonb NOT NULL DEFAULT '{}'::jsonb,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  expires_at timestamptz NOT NULL,
  UNIQUE (provider_business_id, scope, idempotency_key),
  CHECK (jsonb_typeof(response_reference) = 'object')
);

CREATE TABLE activity_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL,
  project_id uuid NOT NULL,
  stage_id uuid,
  activity_type text NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  actor_kind text NOT NULL CHECK (actor_kind IN ('provider_user', 'client', 'system')),
  actor_membership_id uuid,
  actor_client_grant_id uuid,
  actor_display_name_snapshot text NOT NULL,
  client_visible boolean NOT NULL DEFAULT false,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, project_id, id),
  FOREIGN KEY (provider_business_id, project_id)
    REFERENCES projects(provider_business_id, id),
  FOREIGN KEY (provider_business_id, actor_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  FOREIGN KEY (provider_business_id, project_id, actor_client_grant_id)
    REFERENCES client_project_grants(provider_business_id, project_id, id),
  CHECK (jsonb_typeof(details) = 'object'),
  CHECK (
    (actor_kind = 'provider_user' AND actor_membership_id IS NOT NULL
      AND actor_client_grant_id IS NULL)
    OR (actor_kind = 'client' AND actor_client_grant_id IS NOT NULL
      AND actor_membership_id IS NULL)
    OR (actor_kind = 'system' AND actor_membership_id IS NULL
      AND actor_client_grant_id IS NULL)
  )
);

CREATE TABLE outbox_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL REFERENCES provider_businesses(id),
  project_id uuid,
  job_type text NOT NULL,
  payload_version integer NOT NULL CHECK (payload_version > 0),
  payload jsonb NOT NULL,
  deduplication_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'claimed', 'retry_wait', 'completed', 'dead')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_by text,
  lease_expires_at timestamptz,
  last_failure_code text,
  last_failure_summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (provider_business_id, job_type, deduplication_key),
  FOREIGN KEY (provider_business_id, project_id)
    REFERENCES projects(provider_business_id, id),
  CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX projects_worklist_idx
  ON projects (provider_business_id, lifecycle_state, updated_at DESC);
CREATE INDEX stages_project_position_idx
  ON stages (provider_business_id, project_id, position);
CREATE INDEX invitations_pending_idx
  ON client_invitations (expires_at)
  WHERE status = 'pending';
CREATE INDEX client_sessions_active_idx
  ON client_sessions (client_project_grant_id, expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX submission_revisions_history_idx
  ON submission_revisions (stage_id, revision_number DESC);
CREATE INDEX change_request_events_history_idx
  ON change_request_events (change_request_id, occurred_at, id);
CREATE INDEX evidence_retention_idx
  ON evidence_objects (lifecycle_state, retain_until)
  WHERE legal_hold_at IS NULL;
CREATE INDEX invoices_project_issued_idx
  ON invoices (provider_business_id, project_id, issued_at DESC);
CREATE INDEX invoices_due_idx
  ON invoices (provider_business_id, due_on);
CREATE INDEX payment_attempts_invoice_idx
  ON payment_attempts (invoice_id, created_at DESC);
CREATE UNIQUE INDEX payment_attempts_one_active_per_invoice_idx
  ON payment_attempts (invoice_id)
  WHERE status IN ('created', 'requires_action', 'processing', 'submitted');
CREATE INDEX payment_events_invoice_idx
  ON payment_events (invoice_id, occurred_at, id);
CREATE INDEX payment_events_origin_idx
  ON payment_events (originating_payment_event_id)
  WHERE originating_payment_event_id IS NOT NULL;
CREATE INDEX activity_project_timeline_idx
  ON activity_records (provider_business_id, project_id, occurred_at, id);
CREATE INDEX activity_client_timeline_idx
  ON activity_records (provider_business_id, project_id, occurred_at, id)
  WHERE client_visible;
CREATE INDEX outbox_claimable_idx
  ON outbox_jobs (next_attempt_at, created_at)
  WHERE status IN ('pending', 'retry_wait');
CREATE INDEX outbox_lease_idx
  ON outbox_jobs (lease_expires_at)
  WHERE status = 'claimed';

CREATE TRIGGER users_set_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER provider_businesses_set_updated_at
  BEFORE UPDATE ON provider_businesses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER business_memberships_set_updated_at
  BEFORE UPDATE ON business_memberships FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER client_contacts_set_updated_at
  BEFORE UPDATE ON client_contacts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER projects_set_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER stages_set_updated_at
  BEFORE UPDATE ON stages FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER client_invitations_set_updated_at
  BEFORE UPDATE ON client_invitations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER submission_drafts_set_updated_at
  BEFORE UPDATE ON submission_drafts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER evidence_objects_set_updated_at
  BEFORE UPDATE ON evidence_objects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER invoice_drafts_set_updated_at
  BEFORE UPDATE ON invoice_drafts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER invoice_draft_items_set_updated_at
  BEFORE UPDATE ON invoice_draft_items FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER payment_attempts_set_updated_at
  BEFORE UPDATE ON payment_attempts FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER refund_requests_set_updated_at
  BEFORE UPDATE ON refund_requests FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER submission_revisions_immutable
  BEFORE UPDATE OR DELETE ON submission_revisions
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER submission_terminal_decisions_immutable
  BEFORE UPDATE OR DELETE ON submission_terminal_decisions
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER approvals_immutable
  BEFORE UPDATE OR DELETE ON approvals
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER change_requests_immutable
  BEFORE UPDATE OR DELETE ON change_requests
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER change_request_evidence_notes_immutable
  BEFORE UPDATE OR DELETE ON change_request_evidence_notes
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER change_request_events_immutable
  BEFORE UPDATE OR DELETE ON change_request_events
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER submission_withdrawals_immutable
  BEFORE UPDATE OR DELETE ON submission_withdrawals
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER submission_revision_evidence_immutable
  BEFORE UPDATE OR DELETE ON submission_revision_evidence
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER evidence_comments_immutable
  BEFORE UPDATE OR DELETE ON evidence_comments
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER invoices_immutable
  BEFORE UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER invoice_line_items_immutable
  BEFORE UPDATE OR DELETE ON invoice_line_items
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER invoice_corrections_immutable
  BEFORE UPDATE OR DELETE ON invoice_corrections
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER payment_events_immutable
  BEFORE UPDATE OR DELETE ON payment_events
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER payment_event_entries_immutable
  BEFORE UPDATE OR DELETE ON payment_event_entries
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();
CREATE TRIGGER activity_records_immutable
  BEFORE UPDATE OR DELETE ON activity_records
  FOR EACH ROW EXECUTE FUNCTION reject_immutable_change();

COMMIT;
