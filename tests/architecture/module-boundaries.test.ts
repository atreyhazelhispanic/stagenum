import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const forbiddenDomainImports = [
  'next',
  'react',
  'pg',
  'pino',
  'stripe',
  '@aws-sdk',
  '/application/',
  '/infrastructure/',
  '/platform/',
] as const;

const forbiddenApplicationImports = [
  'next',
  'react',
  'pg',
  'pino',
  'stripe',
  '@aws-sdk',
  '/infrastructure/',
  '/platform/',
] as const;

async function findTypeScriptFiles(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const location = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return findTypeScriptFiles(location);
      }
      return entry.isFile() && entry.name.endsWith('.ts') ? [location] : [];
    }),
  );
  return nested.flat();
}

function importedSpecifiers(source: string): readonly string[] {
  return [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)]
    .map((match) => match[1])
    .filter((specifier): specifier is string => specifier !== undefined);
}

describe('module dependency direction', () => {
  it('keeps domain and application code independent of frameworks and adapters', async () => {
    const files = await findTypeScriptFiles(path.join(process.cwd(), 'src/modules'));
    const violations: string[] = [];

    for (const file of files) {
      const normalized = file.split(path.sep).join('/');
      const layer = normalized.includes('/domain/')
        ? 'domain'
        : normalized.includes('/application/')
          ? 'application'
          : undefined;
      if (layer === undefined) {
        continue;
      }

      const forbidden = layer === 'domain' ? forbiddenDomainImports : forbiddenApplicationImports;
      const source = await readFile(file, 'utf8');
      for (const specifier of importedSpecifiers(source)) {
        if (forbidden.some((fragment) => specifier.includes(fragment))) {
          violations.push(`${path.relative(process.cwd(), file)} imports ${specifier}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
