import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { listJournalEntries } from '@/lib/server/erp-store';

export async function GET() {
  return NextResponse.json(ok(await listJournalEntries()));
}
