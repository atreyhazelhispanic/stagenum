import { describe, expect, it } from 'vitest';

import {
  assertStageImageLimit,
  maximumStageImages,
  StageImageLimitExceededError,
} from '@/src/modules/evidence/domain/stage-evidence';

describe('stage evidence limits', () => {
  it('accepts the MVP maximum of ten images', () => {
    expect(() => assertStageImageLimit(maximumStageImages)).not.toThrow();
  });

  it('rejects an eleventh image', () => {
    expect(() => assertStageImageLimit(maximumStageImages + 1)).toThrow(
      StageImageLimitExceededError,
    );
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid image count %s',
    (imageCount) => {
      expect(() => assertStageImageLimit(imageCount)).toThrow(RangeError);
    },
  );
});
