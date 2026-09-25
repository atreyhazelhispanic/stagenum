import { describe, expect, it } from 'vitest';

import { ReactPdfInvoiceRenderer } from '@/src/modules/billing/infrastructure/react-pdf-invoice-renderer';

describe('React PDF invoice renderer', () => {
  it('renders a PDF document with an immutable branding reference', async () => {
    const document = await new ReactPdfInvoiceRenderer().render({
      invoiceNumber: 'INV-0001',
      providerName: 'Example Provider',
      clientName: 'Example Client',
      stageTitle: 'Completed work',
      currency: 'USD',
      totalMinor: 125_00n,
      brand: {
        providerLogoAssetId: 'logo-1',
        providerLogoStorageKey: 'https://storage.invalid/logo-1.png',
        providerLogoMediaType: 'image/png',
        providerLogoSha256DigestHex: 'a'.repeat(64),
        providerLogoPixelWidth: 800,
        providerLogoPixelHeight: 400,
      },
    });

    expect(document.mediaType).toBe('application/pdf');
    expect(document.filename).toBe('invoice-INV-0001.pdf');
    expect(document.bytes.byteLength).toBeGreaterThan(500);
    expect(new TextDecoder().decode(document.bytes.slice(0, 5))).toBe('%PDF-');
  });
});
