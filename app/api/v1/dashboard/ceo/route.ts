import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { mockDashboardMetrics, mockSalesTransactions } from '@/lib/mock-data';

export async function GET() {
  return NextResponse.json(
    ok({
      metrics: mockDashboardMetrics,
      salesTransactions: mockSalesTransactions.slice(0, 12),
    })
  );
}
