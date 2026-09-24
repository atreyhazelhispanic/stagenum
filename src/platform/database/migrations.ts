import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { Pool, PoolClient } from 'pg';

const migrationNamePattern = /^\d{4}_[a-z0-9_]+\.sql$/;
const advisoryLockKey = 8_157_240_091;

export interface MigrationFile {
  readonly name: string;
  readonly checksum: string;
  readonly sql: string;
}

export interface AppliedMigration {
  readonly name: string;
  readonly checksum: string;
}

export async function loadMigrations(directory: string): Promise<readonly MigrationFile[]> {
  const names = (await readdir(directory))
    .filter((name) => migrationNamePattern.test(name))
    .sort((left, right) => left.localeCompare(right));

  if (names.length === 0) {
    throw new Error(`No migration files found in ${directory}`);
  }

  return Promise.all(
    names.map(async (name) => {
      const rawSql = await readFile(path.join(directory, name), 'utf8');
      const sql = stripTransactionWrapper(rawSql, name);
      return {
        name,
        checksum: createHash('sha256').update(rawSql).digest('hex'),
        sql,
      };
    }),
  );
}

export function stripTransactionWrapper(sql: string, name: string): string {
  const withoutByteOrderMark = sql.replace(/^\uFEFF/, '').trim();
  const match = withoutByteOrderMark.match(/^BEGIN;\s*([\s\S]*?)\s*COMMIT;\s*$/i);

  if (match?.[1] === undefined) {
    throw new Error(
      `Migration ${name} must use an explicit BEGIN/COMMIT wrapper; ` +
        'the runner owns the transaction with the migration-history write.',
    );
  }

  return match[1];
}

async function ensureHistoryTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS stagenum_schema_migrations (
      name text PRIMARY KEY,
      checksum char(64) NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT clock_timestamp()
    )
  `);
}

async function readAppliedMigrations(client: PoolClient): Promise<readonly AppliedMigration[]> {
  const result = await client.query<AppliedMigration>(
    'SELECT name, checksum FROM stagenum_schema_migrations ORDER BY name',
  );
  return result.rows;
}

export async function runMigrations(pool: Pool, directory: string): Promise<readonly string[]> {
  const migrations = await loadMigrations(directory);
  const client = await pool.connect();
  const appliedNow: string[] = [];

  try {
    await client.query('SELECT pg_advisory_lock($1)', [advisoryLockKey]);
    await ensureHistoryTable(client);
    const applied = await readAppliedMigrations(client);
    const knownByName = new Map(applied.map((migration) => [migration.name, migration]));

    for (const migration of migrations) {
      const known = knownByName.get(migration.name);
      if (known !== undefined) {
        if (known.checksum !== migration.checksum) {
          throw new Error(
            `Applied migration ${migration.name} differs from the repository copy. ` +
              'Applied migrations are immutable.',
          );
        }
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query(
          'INSERT INTO stagenum_schema_migrations (name, checksum) VALUES ($1, $2)',
          [migration.name, migration.checksum],
        );
        await client.query('COMMIT');
        appliedNow.push(migration.name);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    return appliedNow;
  } finally {
    try {
      await client.query('SELECT pg_advisory_unlock($1)', [advisoryLockKey]);
    } finally {
      client.release();
    }
  }
}

export async function getMigrationReadiness(
  pool: Pool,
  directory: string,
): Promise<{ readonly current: boolean; readonly expected: string; readonly applied: string | null }> {
  const migrations = await loadMigrations(directory);
  const expected = migrations.at(-1)?.name;
  if (expected === undefined) {
    throw new Error('Expected at least one migration');
  }

  const result = await pool.query<{ name: string }>(
    `SELECT name
       FROM stagenum_schema_migrations
      ORDER BY name DESC
      LIMIT 1`,
  );
  const applied = result.rows[0]?.name ?? null;

  return { current: applied === expected, expected, applied };
}
