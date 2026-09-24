import pino from 'pino';

import { getEnvironment } from '@/src/config/environment';

const environment = getEnvironment();

export const logger = pino({
  level: environment.LOG_LEVEL,
  base: {
    service: 'stagenum',
    environment: environment.APP_ENV,
    processRole: environment.PROCESS_ROLE,
    release: environment.RELEASE_SHA,
  },
  redact: {
    paths: [
      'authorization',
      'cookie',
      'headers.authorization',
      'headers.cookie',
      'req.headers.authorization',
      'req.headers.cookie',
      'request.headers.authorization',
      'request.headers.cookie',
      'sessionToken',
      'invitationToken',
      'verificationCode',
      'signedUrl',
      'clientSecret',
      'stripeSignature',
      'databaseUrl',
      'DATABASE_URL',
      '*.password',
      '*.secret',
      '*.token',
      '*.code',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    err(error: Error) {
      return {
        type: error.name,
        message: error.message,
        stack: environment.APP_ENV === 'production' ? undefined : error.stack,
      };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
