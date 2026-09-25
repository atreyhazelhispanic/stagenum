import { describe, expect, it, vi } from 'vitest';

import { prepareProviderLogoUpload } from '@/src/modules/branding/application/prepare-provider-logo-upload';
import type { ProviderLogoStorage } from '@/src/modules/branding/application/provider-logo-storage';
import { providerLogoPolicy } from '@/src/modules/branding/domain/provider-logo';

describe('prepare provider logo upload', () => {
  it('requests a tenant-scoped, size-bounded upload grant', async () => {
    const createUploadGrant = vi.fn().mockResolvedValue({
      brandAssetId: 'logo-1',
      storageKey: 'businesses/business-1/branding/logo-1',
      uploadUrl: 'https://storage.invalid/signed-upload',
      expiresAt: new Date('2026-09-25T00:05:00Z'),
    });
    const storage: ProviderLogoStorage = {
      createUploadGrant,
      markAvailable: vi.fn(),
    };

    const grant = await prepareProviderLogoUpload(
      {
        providerBusinessId: 'business-1',
        actorMembershipId: 'membership-1',
        displayFilename: 'brand.png',
        declaredMediaType: 'image/png',
        expectedByteSize: 300_000,
      },
      storage,
    );

    expect(grant.brandAssetId).toBe('logo-1');
    expect(createUploadGrant).toHaveBeenCalledWith({
      providerBusinessId: 'business-1',
      actorMembershipId: 'membership-1',
      displayFilename: 'brand.png',
      declaredMediaType: 'image/png',
      expectedByteSize: 300_000,
      maximumBytes: providerLogoPolicy.maximumBytes,
    });
  });

  it('rejects an oversized upload before storage is called', async () => {
    const createUploadGrant = vi.fn();
    const storage: ProviderLogoStorage = {
      createUploadGrant,
      markAvailable: vi.fn(),
    };

    await expect(
      prepareProviderLogoUpload(
        {
          providerBusinessId: 'business-1',
          actorMembershipId: 'membership-1',
          displayFilename: 'brand.png',
          declaredMediaType: 'image/png',
          expectedByteSize: providerLogoPolicy.maximumBytes + 1,
        },
        storage,
      ),
    ).rejects.toThrow(/2.5 MiB/);
    expect(createUploadGrant).not.toHaveBeenCalled();
  });
});
