import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { listTrialBalance } from '@/lib/server/erp-store';

export async function GET() {
  return NextResponse.json(ok(await listTrialBalance()));
}
