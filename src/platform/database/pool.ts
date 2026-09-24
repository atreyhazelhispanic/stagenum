import { Pool } from 'pg';

import { getEnvironment } from '@/src/config/environment';
import { logger } from '@/src/platform/logging/logger';

declare global {
  var stagenumDatabasePool: Pool | undefined;
}

function createPool(): Pool {
  const environment = getEnvironment();
  const pool = new Pool({
    connectionString: environment.DATABASE_URL,
    max: environment.PROCESS_ROLE === 'worker' ? 5 : 10,
    connectionTimeoutMillis: 3_000,
    idleTimeoutMillis: 30_000,
    application_name: `stagenum-${environment.PROCESS_ROLE}`,
  });

  pool.on('error', (error) => {
    logger.error({ event: 'database.pool.error', err: error }, 'Database pool error');
  });

  return pool;
}

export function getDatabasePool(): Pool {
  globalThis.stagenumDatabasePool ??= createPool();
  return globalThis.stagenumDatabasePool;
}

export async function closeDatabasePool(): Promise<void> {
  if (globalThis.stagenumDatabasePool !== undefined) {
    await globalThis.stagenumDatabasePool.end();
    globalThis.stagenumDatabasePool = undefined;
  }
}
