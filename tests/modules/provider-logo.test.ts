import { describe, expect, it } from 'vitest';

import {
  ProviderLogoValidationError,
  providerLogoPolicy,
  validateProviderLogo,
  validateProviderLogoUploadRequest,
} from '@/src/modules/branding/domain/provider-logo';

const validLogo = {
  displayFilename: 'company-logo.png',
  declaredMediaType: 'image/png',
  detectedMediaType: 'image/png',
  byteSize: 128_000,
  pixelWidth: 800,
  pixelHeight: 400,
  sha256DigestHex: 'a'.repeat(64),
} as const;

describe('provider logo validation', () => {
  it('accepts a bounded upload request before object inspection', () => {
    expect(
      validateProviderLogoUploadRequest({
        displayFilename: 'company-logo.jpg',
        declaredMediaType: 'image/jpeg',
        expectedByteSize: 512_000,
      }),
    ).toEqual({
      displayFilename: 'company-logo.jpg',
      declaredMediaType: 'image/jpeg',
      expectedByteSize: 512_000,
    });
  });

  it('accepts a bounded raster logo', () => {
    expect(validateProviderLogo(validLogo)).toEqual(validLogo);
  });

  it('rejects oversized files and dimensions', () => {
    expect(() =>
      validateProviderLogo({
        ...validLogo,
        byteSize: providerLogoPolicy.maximumBytes + 1,
        pixelWidth: providerLogoPolicy.maximumWidthPixels + 1,
      }),
    ).toThrow(ProviderLogoValidationError);
  });

  it('rejects mismatched or unsupported content types', () => {
    expect(() =>
      validateProviderLogo({
        ...validLogo,
        declaredMediaType: 'image/jpeg',
        detectedMediaType: 'image/svg+xml',
      }),
    ).toThrow(/declared and detected media types must match/);
  });

  it('rejects extreme aspect ratios', () => {
    expect(() =>
      validateProviderLogo({ ...validLogo, pixelWidth: 1024, pixelHeight: 32 }),
    ).toThrow(/aspect ratio/);
  });
});
