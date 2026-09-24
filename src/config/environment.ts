import { z } from 'zod';

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_ENV: z.enum(['local', 'test', 'staging', 'production']),
    PROCESS_ROLE: z.enum(['web', 'worker']),
    DATABASE_URL: z
      .string()
      .min(1)
      .refine(
        (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
        'must be a PostgreSQL connection URL',
      ),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    RELEASE_SHA: z.string().min(1).default('local'),
    WORKER_ID: z.string().min(1).default('local-worker'),
    WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(250).max(60_000).default(5_000),
    MIGRATIONS_DIR: z.string().min(1).default('db/migrations'),
  })
  .superRefine((value, context) => {
    if (value.APP_ENV === 'production' && value.NODE_ENV !== 'production') {
      context.addIssue({
        code: 'custom',
        path: ['NODE_ENV'],
        message: 'must be production when APP_ENV is production',
      });
    }
  });

export type Environment = z.infer<typeof environmentSchema>;

let cachedEnvironment: Environment | undefined;

export class EnvironmentConfigurationError extends Error {
  constructor(readonly invalidVariables: readonly string[]) {
    super(
      `Invalid environment configuration: ${invalidVariables.join(', ')}. ` +
        'Values are intentionally omitted.',
    );
    this.name = 'EnvironmentConfigurationError';
  }
}

export function parseEnvironment(input: NodeJS.ProcessEnv): Environment {
  const result = environmentSchema.safeParse(input);

  if (!result.success) {
    const invalidVariables = [
      ...new Set(
        result.error.issues.map((issue) =>
          issue.path.length > 0 ? issue.path.join('.') : 'environment',
        ),
      ),
    ].sort();

    throw new EnvironmentConfigurationError(invalidVariables);
  }

  return result.data;
}

export function getEnvironment(): Environment {
  cachedEnvironment ??= parseEnvironment(process.env);
  return cachedEnvironment;
}

export function resetEnvironmentForTests(): void {
  cachedEnvironment = undefined;
}
