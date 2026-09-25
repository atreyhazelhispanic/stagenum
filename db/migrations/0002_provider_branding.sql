BEGIN;

CREATE TABLE provider_brand_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_business_id uuid NOT NULL REFERENCES provider_businesses(id),
  storage_key text NOT NULL,
  display_filename text NOT NULL,
  declared_media_type text NOT NULL
    CHECK (declared_media_type IN ('image/png', 'image/jpeg')),
  detected_media_type text
    CHECK (detected_media_type IS NULL OR detected_media_type IN ('image/png', 'image/jpeg')),
  byte_size bigint CHECK (byte_size IS NULL OR byte_size BETWEEN 1 AND 2097152),
  pixel_width integer CHECK (pixel_width IS NULL OR pixel_width BETWEEN 64 AND 2048),
  pixel_height integer CHECK (pixel_height IS NULL OR pixel_height BETWEEN 32 AND 2048),
  sha256_digest bytea,
  lifecycle_state text NOT NULL DEFAULT 'pending_upload'
    CHECK (lifecycle_state IN (
      'pending_upload', 'uploaded', 'validating', 'available', 'quarantined',
      'deletion_pending', 'deleted', 'expired'
    )),
  created_by_membership_id uuid NOT NULL,
  uploaded_at timestamptz,
  available_at timestamptz,
  deleted_at timestamptz,
  replaced_brand_asset_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_business_id, storage_key),
  UNIQUE (provider_business_id, id),
  FOREIGN KEY (provider_business_id, created_by_membership_id)
    REFERENCES business_memberships(provider_business_id, id),
  FOREIGN KEY (provider_business_id, replaced_brand_asset_id)
    REFERENCES provider_brand_assets(provider_business_id, id),
  CHECK (replaced_brand_asset_id IS NULL OR replaced_brand_asset_id <> id),
  CHECK (
    lifecycle_state <> 'available'
    OR (
      detected_media_type = declared_media_type
      AND byte_size IS NOT NULL
      AND pixel_width IS NOT NULL
      AND pixel_height IS NOT NULL
      AND sha256_digest IS NOT NULL
      AND available_at IS NOT NULL
    )
  )
);

ALTER TABLE provider_businesses
  ADD COLUMN current_logo_asset_id uuid,
  ADD CONSTRAINT provider_businesses_current_logo_fk
    FOREIGN KEY (id, current_logo_asset_id)
    REFERENCES provider_brand_assets(provider_business_id, id);

ALTER TABLE invoices
  ADD COLUMN provider_logo_asset_id_snapshot uuid,
  ADD COLUMN provider_logo_storage_key_snapshot text,
  ADD COLUMN provider_logo_media_type_snapshot text,
  ADD COLUMN provider_logo_sha256_digest_snapshot bytea,
  ADD COLUMN provider_logo_pixel_width_snapshot integer,
  ADD COLUMN provider_logo_pixel_height_snapshot integer,
  ADD CONSTRAINT invoices_provider_logo_fk
    FOREIGN KEY (provider_business_id, provider_logo_asset_id_snapshot)
    REFERENCES provider_brand_assets(provider_business_id, id),
  ADD CONSTRAINT invoices_provider_logo_snapshot_check CHECK (
    num_nonnulls(
      provider_logo_asset_id_snapshot,
      provider_logo_storage_key_snapshot,
      provider_logo_media_type_snapshot,
      provider_logo_sha256_digest_snapshot,
      provider_logo_pixel_width_snapshot,
      provider_logo_pixel_height_snapshot
    ) IN (0, 6)
  ),
  ADD CONSTRAINT invoices_provider_logo_media_type_check CHECK (
    provider_logo_media_type_snapshot IS NULL
    OR provider_logo_media_type_snapshot IN ('image/png', 'image/jpeg')
  );

CREATE INDEX provider_brand_assets_lifecycle_idx
  ON provider_brand_assets (provider_business_id, lifecycle_state, created_at DESC);

CREATE TRIGGER provider_brand_assets_set_updated_at
  BEFORE UPDATE ON provider_brand_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
