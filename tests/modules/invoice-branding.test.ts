import { describe, expect, it } from 'vitest';

import { snapshotInvoiceBranding } from '@/src/modules/billing/domain/invoice-branding';

const availableLogo = {
  brandAssetId: 'logo-1',
  providerBusinessId: 'business-1',
  storageKey: 'businesses/business-1/branding/logo-1',
  mediaType: 'image/png',
  sha256DigestHex: 'b'.repeat(64),
  pixelWidth: 800,
  pixelHeight: 400,
  lifecycleState: 'available',
} as const;

describe('invoice branding snapshot', () => {
  it('allows an invoice without optional branding', () => {
    expect(snapshotInvoiceBranding('business-1', null)).toBeNull();
  });

  it('captures the exact available logo metadata at issuance', () => {
    const snapshot = snapshotInvoiceBranding('business-1', availableLogo);

    expect(snapshot).toEqual({
      providerLogoAssetId: 'logo-1',
      providerLogoStorageKey: 'businesses/business-1/branding/logo-1',
      providerLogoMediaType: 'image/png',
      providerLogoSha256DigestHex: 'b'.repeat(64),
      providerLogoPixelWidth: 800,
      providerLogoPixelHeight: 400,
    });
    expect(Object.isFrozen(snapshot)).toBe(true);
  });

  it('rejects a logo owned by another tenant', () => {
    expect(() => snapshotInvoiceBranding('business-2', availableLogo)).toThrow(
      /different business/,
    );
  });
});
