BEGIN;

ALTER TABLE provider_brand_assets
  DROP CONSTRAINT provider_brand_assets_byte_size_check,
  ADD CONSTRAINT provider_brand_assets_byte_size_check
    CHECK (byte_size IS NULL OR byte_size BETWEEN 1 AND 2621440);

COMMIT;
