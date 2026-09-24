import { setTimeout as delay } from 'node:timers/promises';

import { getEnvironment } from '@/src/config/environment';
import { closeDatabasePool, getDatabasePool } from '@/src/platform/database/pool';
import { logger } from '@/src/platform/logging/logger';

async function readOutboxState(): Promise<{
  readonly available: number;
  readonly oldestAvailableAt: string | null;
}> {
  const result = await getDatabasePool().query<{
    available: string;
    oldest_available_at: Date | null;
  }>(`
    SELECT count(*)::text AS available,
           min(next_attempt_at) AS oldest_available_at
      FROM outbox_jobs
     WHERE status IN ('pending', 'retry_wait')
       AND next_attempt_at <= clock_timestamp()
  `);
  const row = result.rows[0];

  return {
    available: Number(row?.available ?? 0),
    oldestAvailableAt: row?.oldest_available_at?.toISOString() ?? null,
  };
}

async function run(): Promise<void> {
  const environment = getEnvironment();
  if (environment.PROCESS_ROLE !== 'worker') {
    throw new Error('The worker entry point requires PROCESS_ROLE=worker');
  }

  const abortController = new AbortController();
  const requestShutdown = (signal: NodeJS.Signals): void => {
    logger.info({ event: 'worker.shutdown.requested', signal });
    abortController.abort();
  };

  process.once('SIGINT', requestShutdown);
  process.once('SIGTERM', requestShutdown);

  await getDatabasePool().query('SELECT 1');
  logger.info(
    {
      event: 'worker.started',
      workerId: environment.WORKER_ID,
      pollIntervalMs: environment.WORKER_POLL_INTERVAL_MS,
    },
    'Worker foundation started',
  );

  while (!abortController.signal.aborted) {
    try {
      const state = await readOutboxState();
      logger.debug({
        event: 'worker.outbox.observed',
        workerId: environment.WORKER_ID,
        ...state,
      });
    } catch (error) {
      logger.error({ event: 'worker.poll.failed', err: error }, 'Worker poll failed');
    }

    try {
      await delay(environment.WORKER_POLL_INTERVAL_MS, undefined, {
        signal: abortController.signal,
      });
    } catch (error) {
      if (!abortController.signal.aborted) {
        throw error;
      }
    }
  }

  await closeDatabasePool();
  logger.info({ event: 'worker.stopped', workerId: environment.WORKER_ID });
}

run().catch(async (error: unknown) => {
  logger.fatal({ event: 'worker.startup.failed', err: error }, 'Worker stopped');
  await closeDatabasePool();
  process.exitCode = 1;
});
