import { describe, expect, it } from 'vitest';

import { checkReadiness } from '@/src/modules/system/application/check-readiness';
import type { ReadinessProbe } from '@/src/modules/system/application/readiness-probe';

describe('checkReadiness', () => {
  it('returns a successful probe result', async () => {
    const probe: ReadinessProbe = {
      check: async () => ({
        ready: true,
        checks: [
          { name: 'database', status: 'pass' },
          { name: 'schema', status: 'pass' },
        ],
      }),
    };

    await expect(checkReadiness(probe)).resolves.toEqual({
      ready: true,
      checks: [
        { name: 'database', status: 'pass' },
        { name: 'schema', status: 'pass' },
      ],
    });
  });

  it('fails closed without returning infrastructure error details', async () => {
    const probe: ReadinessProbe = {
      check: async () => {
        throw new Error('postgresql://user:secret@database/private');
      },
    };

    const result = await checkReadiness(probe);

    expect(result).toEqual({
      ready: false,
      checks: [
        { name: 'database', status: 'fail' },
        { name: 'schema', status: 'fail' },
      ],
    });
    expect(JSON.stringify(result)).not.toContain('secret');
  });
});
