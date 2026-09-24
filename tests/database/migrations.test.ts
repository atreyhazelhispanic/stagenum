import { describe, expect, it } from 'vitest';

import { stripTransactionWrapper } from '@/src/platform/database/migrations';

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
});
