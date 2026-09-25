export const providerLogoPolicy = {
  acceptedMediaTypes: ['image/png', 'image/jpeg'],
  maximumBytes: 2.5 * 1024 * 1024,
  minimumWidthPixels: 64,
  minimumHeightPixels: 32,
  maximumWidthPixels: 2048,
  maximumHeightPixels: 2048,
  maximumAspectRatio: 8,
} as const;

export type ProviderLogoMediaType = (typeof providerLogoPolicy.acceptedMediaTypes)[number];

export interface ProviderLogoCandidate {
  readonly displayFilename: string;
  readonly declaredMediaType: string;
  readonly detectedMediaType: string;
  readonly byteSize: number;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly sha256DigestHex: string;
}

export interface ProviderLogoUploadRequest {
  readonly displayFilename: string;
  readonly declaredMediaType: string;
  readonly expectedByteSize: number;
}

export interface ValidatedProviderLogoUploadRequest extends ProviderLogoUploadRequest {
  readonly declaredMediaType: ProviderLogoMediaType;
}

export interface ValidatedProviderLogo extends ProviderLogoCandidate {
  readonly declaredMediaType: ProviderLogoMediaType;
  readonly detectedMediaType: ProviderLogoMediaType;
}

export class ProviderLogoValidationError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Provider logo is invalid: ${issues.join('; ')}`);
    this.name = 'ProviderLogoValidationError';
    this.issues = issues;
  }
}

function isAcceptedMediaType(value: string): value is ProviderLogoMediaType {
  return providerLogoPolicy.acceptedMediaTypes.some((mediaType) => mediaType === value);
}

export function validateProviderLogoUploadRequest(
  request: ProviderLogoUploadRequest,
): ValidatedProviderLogoUploadRequest {
  const issues: string[] = [];

  if (request.displayFilename.trim().length === 0) {
    issues.push('display filename is required');
  }
  if (!isAcceptedMediaType(request.declaredMediaType)) {
    issues.push('declared media type must be image/png or image/jpeg');
  }
  if (!Number.isSafeInteger(request.expectedByteSize) || request.expectedByteSize < 1) {
    issues.push('expected byte size must be a positive integer');
  } else if (request.expectedByteSize > providerLogoPolicy.maximumBytes) {
    issues.push('logo must not exceed 2.5 MiB');
  }

  if (issues.length > 0) {
    throw new ProviderLogoValidationError(issues);
  }

  return request as ValidatedProviderLogoUploadRequest;
}

export function validateProviderLogo(candidate: ProviderLogoCandidate): ValidatedProviderLogo {
  const issues: string[] = [];

  if (candidate.displayFilename.trim().length === 0) {
    issues.push('display filename is required');
  }
  if (!isAcceptedMediaType(candidate.declaredMediaType)) {
    issues.push('declared media type must be image/png or image/jpeg');
  }
  if (!isAcceptedMediaType(candidate.detectedMediaType)) {
    issues.push('detected media type must be image/png or image/jpeg');
  }
  if (candidate.declaredMediaType !== candidate.detectedMediaType) {
    issues.push('declared and detected media types must match');
  }
  if (!Number.isSafeInteger(candidate.byteSize) || candidate.byteSize < 1) {
    issues.push('byte size must be a positive integer');
  } else if (candidate.byteSize > providerLogoPolicy.maximumBytes) {
    issues.push('logo must not exceed 2.5 MiB');
  }
  if (
    !Number.isSafeInteger(candidate.pixelWidth) ||
    candidate.pixelWidth < providerLogoPolicy.minimumWidthPixels ||
    candidate.pixelWidth > providerLogoPolicy.maximumWidthPixels
  ) {
    issues.push('logo width must be between 64 and 2048 pixels');
  }
  if (
    !Number.isSafeInteger(candidate.pixelHeight) ||
    candidate.pixelHeight < providerLogoPolicy.minimumHeightPixels ||
    candidate.pixelHeight > providerLogoPolicy.maximumHeightPixels
  ) {
    issues.push('logo height must be between 32 and 2048 pixels');
  }
  if (candidate.pixelWidth > 0 && candidate.pixelHeight > 0) {
    const aspectRatio = Math.max(
      candidate.pixelWidth / candidate.pixelHeight,
      candidate.pixelHeight / candidate.pixelWidth,
    );
    if (aspectRatio > providerLogoPolicy.maximumAspectRatio) {
      issues.push('logo aspect ratio must not exceed 8:1');
    }
  }
  if (!/^[a-f\d]{64}$/i.test(candidate.sha256DigestHex)) {
    issues.push('SHA-256 digest must contain 64 hexadecimal characters');
  }

  if (issues.length > 0) {
    throw new ProviderLogoValidationError(issues);
  }

  return candidate as ValidatedProviderLogo;
}
