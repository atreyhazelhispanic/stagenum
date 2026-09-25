import { describe, expect, it, vi } from 'vitest';

import {
  GcsProviderLogoStorage,
  type GcsStorageClient,
} from '@/src/modules/branding/infrastructure/gcs-provider-logo-storage';

describe('GCS provider logo storage adapter', () => {
  it('creates a short-lived, content-type-bound upload grant', async () => {
    const getSignedUrl = vi.fn().mockResolvedValue(['https://storage.invalid/upload']);
    const client: GcsStorageClient = {
      bucket: () => ({ file: () => ({ getSignedUrl, getMetadata: vi.fn() }) }),
    };
    const storage = new GcsProviderLogoStorage({
      bucketName: 'stagenum-private',
      client,
      uploadGrantLifetimeMs: 900_000,
    });

    const grant = await storage.createUploadGrant({
      providerBusinessId: 'business-1',
      actorMembershipId: 'membership-1',
      displayFilename: 'logo.png',
      declaredMediaType: 'image/png',
      expectedByteSize: 100_000,
      maximumBytes: 2_621_440,
    });

    expect(grant.uploadUrl).toBe('https://storage.invalid/upload');
    expect(grant.storageKey).toMatch(/^businesses\/business-1\/branding\//);
    expect(getSignedUrl).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'write', contentType: 'image/png' }),
    );
  });

  it('refuses to release an object whose metadata changed', async () => {
    const client: GcsStorageClient = {
      bucket: () => ({
        file: () => ({
          getSignedUrl: vi.fn(),
          getMetadata: vi.fn().mockResolvedValue([{ size: '10', contentType: 'image/jpeg' }]),
        }),
      }),
    };
    const storage = new GcsProviderLogoStorage({ bucketName: 'stagenum-private', client });

    await expect(
      storage.markAvailable({
        brandAssetId: 'logo-1',
        providerBusinessId: 'business-1',
        storageKey: 'businesses/business-1/branding/logo-1',
        metadata: {
          displayFilename: 'logo.png',
          declaredMediaType: 'image/png',
          detectedMediaType: 'image/png',
          byteSize: 10,
          pixelWidth: 800,
          pixelHeight: 400,
          sha256DigestHex: 'a'.repeat(64),
        },
      }),
    ).rejects.toThrow(/content type/);
  });
});
