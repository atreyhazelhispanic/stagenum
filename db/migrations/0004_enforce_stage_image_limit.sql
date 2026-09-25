BEGIN;

CREATE FUNCTION enforce_submission_draft_image_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  linked_media_type text;
  existing_image_count integer;
BEGIN
  -- Serialize attachments for one stage so concurrent inserts cannot bypass the cap.
  PERFORM 1
  FROM stages
  WHERE provider_business_id = NEW.provider_business_id
    AND project_id = NEW.project_id
    AND id = NEW.stage_id
  FOR UPDATE;

  SELECT declared_media_type
  INTO STRICT linked_media_type
  FROM evidence_objects
  WHERE provider_business_id = NEW.provider_business_id
    AND project_id = NEW.project_id
    AND id = NEW.evidence_object_id;

  IF linked_media_type LIKE 'image/%' THEN
    IF TG_OP = 'UPDATE' THEN
      SELECT count(*)
      INTO existing_image_count
      FROM submission_draft_evidence links
      JOIN evidence_objects evidence
        ON evidence.provider_business_id = links.provider_business_id
       AND evidence.project_id = links.project_id
       AND evidence.id = links.evidence_object_id
      WHERE links.submission_draft_id = NEW.submission_draft_id
        AND evidence.declared_media_type LIKE 'image/%'
        AND (links.submission_draft_id, links.evidence_object_id)
          IS DISTINCT FROM (OLD.submission_draft_id, OLD.evidence_object_id);
    ELSE
      SELECT count(*)
      INTO existing_image_count
      FROM submission_draft_evidence links
      JOIN evidence_objects evidence
        ON evidence.provider_business_id = links.provider_business_id
       AND evidence.project_id = links.project_id
       AND evidence.id = links.evidence_object_id
      WHERE links.submission_draft_id = NEW.submission_draft_id
        AND evidence.declared_media_type LIKE 'image/%';
    END IF;

    IF existing_image_count >= 10 THEN
      RAISE EXCEPTION 'a submission draft cannot contain more than 10 images'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE FUNCTION enforce_submission_revision_image_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  linked_media_type text;
  existing_image_count integer;
BEGIN
  -- Revision evidence is normally copied in one transaction, but the same lock
  -- keeps the invariant safe if concurrent writers are ever introduced.
  PERFORM 1
  FROM stages
  WHERE provider_business_id = NEW.provider_business_id
    AND project_id = NEW.project_id
    AND id = NEW.stage_id
  FOR UPDATE;

  SELECT declared_media_type
  INTO STRICT linked_media_type
  FROM evidence_objects
  WHERE provider_business_id = NEW.provider_business_id
    AND project_id = NEW.project_id
    AND id = NEW.evidence_object_id;

  IF linked_media_type LIKE 'image/%' THEN
    IF TG_OP = 'UPDATE' THEN
      SELECT count(*)
      INTO existing_image_count
      FROM submission_revision_evidence links
      JOIN evidence_objects evidence
        ON evidence.provider_business_id = links.provider_business_id
       AND evidence.project_id = links.project_id
       AND evidence.id = links.evidence_object_id
      WHERE links.submission_revision_id = NEW.submission_revision_id
        AND evidence.declared_media_type LIKE 'image/%'
        AND (links.submission_revision_id, links.evidence_object_id)
          IS DISTINCT FROM (OLD.submission_revision_id, OLD.evidence_object_id);
    ELSE
      SELECT count(*)
      INTO existing_image_count
      FROM submission_revision_evidence links
      JOIN evidence_objects evidence
        ON evidence.provider_business_id = links.provider_business_id
       AND evidence.project_id = links.project_id
       AND evidence.id = links.evidence_object_id
      WHERE links.submission_revision_id = NEW.submission_revision_id
        AND evidence.declared_media_type LIKE 'image/%';
    END IF;

    IF existing_image_count >= 10 THEN
      RAISE EXCEPTION 'a submission revision cannot contain more than 10 images'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER submission_draft_evidence_image_limit
  BEFORE INSERT OR UPDATE ON submission_draft_evidence
  FOR EACH ROW EXECUTE FUNCTION enforce_submission_draft_image_limit();

CREATE TRIGGER submission_revision_evidence_image_limit
  BEFORE INSERT OR UPDATE ON submission_revision_evidence
  FOR EACH ROW EXECUTE FUNCTION enforce_submission_revision_image_limit();

COMMIT;
