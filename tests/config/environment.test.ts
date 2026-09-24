import { describe, expect, it } from 'vitest';

import {
  EnvironmentConfigurationError,
  parseEnvironment,
} from '@/src/config/environment';

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  APP_ENV: 'test',
  PROCESS_ROLE: 'web',
  DATABASE_URL: 'postgresql://user:secret@localhost:5432/stagenum_test',
  LOG_LEVEL: 'silent',
  RELEASE_SHA: 'test-release',
};

describe('environment configuration', () => {
  it('parses valid server configuration', () => {
    const environment = parseEnvironment(validEnvironment);

    expect(environment.APP_ENV).toBe('test');
    expect(environment.PROCESS_ROLE).toBe('web');
    expect(environment.WORKER_POLL_INTERVAL_MS).toBe(5_000);
  });

  it('names missing variables without exposing supplied values', () => {
    const secret = 'do-not-print-this-database-secret';

    expect(() =>
      parseEnvironment({
        ...validEnvironment,
        APP_ENV: undefined,
        DATABASE_URL: `mysql://user:${secret}@localhost/stagenum`,
      }),
    ).toThrow(EnvironmentConfigurationError);

    try {
      parseEnvironment({
        ...validEnvironment,
        APP_ENV: undefined,
        DATABASE_URL: `mysql://user:${secret}@localhost/stagenum`,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentConfigurationError);
      expect(String(error)).toContain('APP_ENV');
      expect(String(error)).toContain('DATABASE_URL');
      expect(String(error)).not.toContain(secret);
    }
  });

  it('rejects a non-production Node runtime for the production environment', () => {
    expect(() =>
      parseEnvironment({
        ...validEnvironment,
        APP_ENV: 'production',
        NODE_ENV: 'development',
      }),
    ).toThrow(/NODE_ENV/);
  });
});
