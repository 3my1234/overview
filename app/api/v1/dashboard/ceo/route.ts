import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { getCeoDashboardData } from '@/lib/server/erp-store';

export async function GET() {
  return NextResponse.json(ok(await getCeoDashboardData()));
}
