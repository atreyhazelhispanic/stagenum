import { Storage } from '@google-cloud/storage';

import type {
  AvailableProviderLogo,
  ProviderLogoStorage,
  ProviderLogoUploadGrant,
  ProviderLogoUploadGrantRequest,
} from '../application/provider-logo-storage';

interface GcsObjectMetadata {
  readonly size?: string | number;
  readonly contentType?: string;
}

interface GcsFileLike {
  getSignedUrl(options: {
    readonly version: 'v4';
    readonly action: 'write';
    readonly expires: number;
    readonly contentType: string;
  }): Promise<readonly [string]>;
  getMetadata(): Promise<readonly [GcsObjectMetadata, ...unknown[]]>;
}

interface GcsBucketLike {
  file(storageKey: string): GcsFileLike;
}

export interface GcsStorageClient {
  bucket(bucketName: string): GcsBucketLike;
}

export interface GcsProviderLogoStorageOptions {
  readonly bucketName: string;
  readonly uploadGrantLifetimeMs?: number;
  readonly client?: GcsStorageClient;
}

const defaultUploadGrantLifetimeMs = 15 * 60 * 1000;

export class GcsProviderLogoStorage implements ProviderLogoStorage {
  private readonly bucket: GcsBucketLike;
  private readonly uploadGrantLifetimeMs: number;

  constructor(options: GcsProviderLogoStorageOptions) {
    if (options.bucketName.trim().length === 0) {
      throw new Error('GCS bucket name is required');
    }
    this.bucket = (options.client ?? new Storage()).bucket(options.bucketName);
    this.uploadGrantLifetimeMs = options.uploadGrantLifetimeMs ?? defaultUploadGrantLifetimeMs;
  }

  async createUploadGrant(request: ProviderLogoUploadGrantRequest): Promise<ProviderLogoUploadGrant> {
    const storageKey = `businesses/${request.providerBusinessId}/branding/${crypto.randomUUID()}`;
    const expires = Date.now() + this.uploadGrantLifetimeMs;
    const file = this.bucket.file(storageKey);
    const [uploadUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires,
      contentType: request.declaredMediaType,
    });

    return {
      brandAssetId: crypto.randomUUID(),
      storageKey,
      uploadUrl,
      expiresAt: new Date(expires),
    };
  }

  async markAvailable(asset: AvailableProviderLogo): Promise<void> {
    const [metadata] = await this.bucket.file(asset.storageKey).getMetadata();
    const actualSize = metadata.size === undefined ? undefined : Number(metadata.size);

    if (actualSize !== asset.metadata.byteSize) {
      throw new Error('GCS object size does not match the validated logo');
    }
    if (metadata.contentType !== asset.metadata.detectedMediaType) {
      throw new Error('GCS object content type does not match the validated logo');
    }
  }
}
