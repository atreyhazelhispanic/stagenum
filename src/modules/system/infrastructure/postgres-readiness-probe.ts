import type { ReadinessProbe } from '@/src/modules/system/application/readiness-probe';
import type { ReadinessResult } from '@/src/modules/system/domain/readiness';
import { getEnvironment } from '@/src/config/environment';
import { getMigrationReadiness } from '@/src/platform/database/migrations';
import { getDatabasePool } from '@/src/platform/database/pool';

export class PostgresReadinessProbe implements ReadinessProbe {
  async check(): Promise<ReadinessResult> {
    const pool = getDatabasePool();
    await pool.query('SELECT 1');
    const migration = await getMigrationReadiness(
      pool,
      getEnvironment().MIGRATIONS_DIR,
    );

    if (!migration.current) {
      return {
        ready: false,
        checks: [
          { name: 'database', status: 'pass' },
          { name: 'schema', status: 'fail' },
        ],
      };
    }

    return {
      ready: true,
      checks: [
        { name: 'database', status: 'pass' },
        { name: 'schema', status: 'pass' },
      ],
    };
  }
}
