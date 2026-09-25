import { getEnvironment } from '@/src/config/environment';
import { getMigrationReadiness } from '@/src/platform/database/migrations';
import { closeDatabasePool, getDatabasePool } from '@/src/platform/database/pool';
import { logger } from '@/src/platform/logging/logger';

const requiredTables = [
  'provider_businesses',
  'provider_brand_assets',
  'projects',
  'submission_revisions',
  'invoices',
  'payment_attempts',
  'payment_events',
  'outbox_jobs',
] as const;

async function main(): Promise<void> {
  const environment = getEnvironment();
  const pool = getDatabasePool();
  const migration = await getMigrationReadiness(pool, environment.MIGRATIONS_DIR);
  const result = await pool.query<{ table_name: string }>(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])`,
    [requiredTables],
  );
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !found.has(table));

  if (!migration.current || missing.length > 0) {
    throw new Error(
      `Schema verification failed: current=${migration.current}; ` +
        `missing=${missing.join(',') || 'none'}`,
    );
  }

  logger.info({
    event: 'database.schema.verified',
    migration: migration.applied,
    requiredTableCount: requiredTables.length,
  });
}

main()
  .catch((error: unknown) => {
    logger.fatal({ event: 'database.schema.verification_failed', err: error });
    process.exitCode = 1;
  })
  .finally(closeDatabasePool);
