import type { ValidatedProviderLogo } from '../domain/provider-logo';

export interface ProviderLogoUploadGrantRequest {
  readonly providerBusinessId: string;
  readonly actorMembershipId: string;
  readonly displayFilename: string;
  readonly declaredMediaType: 'image/png' | 'image/jpeg';
  readonly expectedByteSize: number;
  readonly maximumBytes: number;
}

export interface ProviderLogoUploadGrant {
  readonly brandAssetId: string;
  readonly storageKey: string;
  readonly uploadUrl: string;
  readonly expiresAt: Date;
}

export interface AvailableProviderLogo {
  readonly brandAssetId: string;
  readonly providerBusinessId: string;
  readonly storageKey: string;
  readonly metadata: ValidatedProviderLogo;
}

export interface ProviderLogoStorage {
  createUploadGrant(request: ProviderLogoUploadGrantRequest): Promise<ProviderLogoUploadGrant>;
  markAvailable(asset: AvailableProviderLogo): Promise<void>;
}
