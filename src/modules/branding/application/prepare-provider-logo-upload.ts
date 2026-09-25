import {
  providerLogoPolicy,
  validateProviderLogoUploadRequest,
  type ProviderLogoUploadRequest,
} from '../domain/provider-logo';
import type { ProviderLogoStorage, ProviderLogoUploadGrant } from './provider-logo-storage';

export interface PrepareProviderLogoUploadCommand extends ProviderLogoUploadRequest {
  readonly providerBusinessId: string;
  readonly actorMembershipId: string;
}

export async function prepareProviderLogoUpload(
  command: PrepareProviderLogoUploadCommand,
  storage: ProviderLogoStorage,
): Promise<ProviderLogoUploadGrant> {
  const validated = validateProviderLogoUploadRequest(command);

  return storage.createUploadGrant({
    providerBusinessId: command.providerBusinessId,
    actorMembershipId: command.actorMembershipId,
    displayFilename: validated.displayFilename,
    declaredMediaType: validated.declaredMediaType,
    expectedByteSize: validated.expectedByteSize,
    maximumBytes: providerLogoPolicy.maximumBytes,
  });
}
