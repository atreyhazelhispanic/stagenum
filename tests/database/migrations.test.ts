import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { loadMigrations, stripTransactionWrapper } from '@/src/platform/database/migrations';

describe('migration parsing', () => {
  it('moves the file transaction under runner ownership', () => {
    expect(
      stripTransactionWrapper('BEGIN;\nCREATE TABLE example (id uuid);\nCOMMIT;\n', 'test.sql'),
    ).toBe('CREATE TABLE example (id uuid);');
  });

  it('rejects an unwrapped migration', () => {
    expect(() =>
      stripTransactionWrapper('CREATE TABLE example (id uuid);', 'test.sql'),
    ).toThrow(/explicit BEGIN\/COMMIT wrapper/);
  });

  it('loads the provider-branding migration after the initial schema', async () => {
    const migrations = await loadMigrations(path.join(process.cwd(), 'db/migrations'));

    expect(migrations.map((migration) => migration.name)).toEqual([
      '0001_initial_domain_schema.sql',
      '0002_provider_branding.sql',
      '0003_expand_brand_asset_size.sql',
    ]);
  });
});
