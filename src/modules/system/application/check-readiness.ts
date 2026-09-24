import type { ReadinessProbe } from '@/src/modules/system/application/readiness-probe';
import type { ReadinessResult } from '@/src/modules/system/domain/readiness';

export async function checkReadiness(probe: ReadinessProbe): Promise<ReadinessResult> {
  try {
    return await probe.check();
  } catch {
    return {
      ready: false,
      checks: [
        { name: 'database', status: 'fail' },
        { name: 'schema', status: 'fail' },
      ],
    };
  }
}
