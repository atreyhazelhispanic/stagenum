export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  const [{ getEnvironment }, { logger }] = await Promise.all([
    import('@/src/config/environment'),
    import('@/src/platform/logging/logger'),
  ]);
  const environment = getEnvironment();

  logger.info({
    event: 'process.started',
    appEnvironment: environment.APP_ENV,
    processRole: environment.PROCESS_ROLE,
    release: environment.RELEASE_SHA,
  });
}
