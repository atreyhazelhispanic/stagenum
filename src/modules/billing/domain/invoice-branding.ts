export interface AvailableProviderLogoForInvoice {
  readonly brandAssetId: string;
  readonly providerBusinessId: string;
  readonly storageKey: string;
  readonly mediaType: 'image/png' | 'image/jpeg';
  readonly sha256DigestHex: string;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly lifecycleState: 'available';
}

export interface InvoiceBrandSnapshot {
  readonly providerLogoAssetId: string;
  readonly providerLogoStorageKey: string;
  readonly providerLogoMediaType: 'image/png' | 'image/jpeg';
  readonly providerLogoSha256DigestHex: string;
  readonly providerLogoPixelWidth: number;
  readonly providerLogoPixelHeight: number;
}

export function snapshotInvoiceBranding(
  invoiceProviderBusinessId: string,
  currentLogo: AvailableProviderLogoForInvoice | null,
): InvoiceBrandSnapshot | null {
  if (currentLogo === null) {
    return null;
  }
  if (currentLogo.providerBusinessId !== invoiceProviderBusinessId) {
    throw new Error('Provider logo belongs to a different business');
  }

  return Object.freeze({
    providerLogoAssetId: currentLogo.brandAssetId,
    providerLogoStorageKey: currentLogo.storageKey,
    providerLogoMediaType: currentLogo.mediaType,
    providerLogoSha256DigestHex: currentLogo.sha256DigestHex,
    providerLogoPixelWidth: currentLogo.pixelWidth,
    providerLogoPixelHeight: currentLogo.pixelHeight,
  });
}
