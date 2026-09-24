import { getEnvironment } from '@/src/config/environment';
import { closeDatabasePool, getDatabasePool } from '@/src/platform/database/pool';
import { runMigrations } from '@/src/platform/database/migrations';
import { logger } from '@/src/platform/logging/logger';

async function main(): Promise<void> {
  const environment = getEnvironment();
  const applied = await runMigrations(getDatabasePool(), environment.MIGRATIONS_DIR);

  logger.info(
    {
      event: 'database.migrations.completed',
      appliedCount: applied.length,
      migrations: applied,
    },
    applied.length === 0 ? 'Database schema is current' : 'Database migrations applied',
  );
}

main()
  .catch((error: unknown) => {
    logger.fatal(
      { event: 'database.migrations.failed', err: error },
      'Database migration failed',
    );
    process.exitCode = 1;
  })
  .finally(closeDatabasePool);
