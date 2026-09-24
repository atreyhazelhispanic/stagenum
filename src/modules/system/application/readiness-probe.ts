import type { ReadinessResult } from '@/src/modules/system/domain/readiness';

export interface ReadinessProbe {
  check(): Promise<ReadinessResult>;
}
