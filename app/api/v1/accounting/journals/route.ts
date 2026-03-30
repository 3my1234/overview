import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { mockJournalEntries } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(ok(mockJournalEntries));
}
