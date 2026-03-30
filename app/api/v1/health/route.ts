import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';

export async function GET() {
  return NextResponse.json(
    ok({
      service: 'palm-oil-platform-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  );
}
