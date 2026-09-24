import { NextResponse } from 'next/server';

import { checkReadiness } from '@/src/modules/system/application/check-readiness';
import { PostgresReadinessProbe } from '@/src/modules/system/infrastructure/postgres-readiness-probe';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
  const result = await checkReadiness(new PostgresReadinessProbe());
  const status = result.ready ? 200 : 503;

  return NextResponse.json(
    result.ready
      ? {
          status: 'ready',
          checks: result.checks,
          timestamp: new Date().toISOString(),
        }
      : {
          status: 'not_ready',
          checks: result.checks,
          timestamp: new Date().toISOString(),
        },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
