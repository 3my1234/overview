import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { getMasterData } from '@/lib/server/in-memory-store';

export async function GET() {
  return NextResponse.json(ok(getMasterData()));
}
