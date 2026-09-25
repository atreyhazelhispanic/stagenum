export const maximumStageImages = 10;

export class StageImageLimitExceededError extends Error {
  constructor(imageCount: number) {
    super(`A stage can contain at most ${maximumStageImages} images; received ${imageCount}.`);
    this.name = 'StageImageLimitExceededError';
  }
}

export function assertStageImageLimit(imageCount: number): void {
  if (!Number.isSafeInteger(imageCount) || imageCount < 0) {
    throw new RangeError('Stage image count must be a non-negative safe integer.');
  }

  if (imageCount > maximumStageImages) {
    throw new StageImageLimitExceededError(imageCount);
  }
}
