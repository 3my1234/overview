import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { mockStockMovements } from '@/lib/mock-data';

export async function GET() {
  const purchases = mockStockMovements.filter((movement) => movement.type === 'purchase');
  return NextResponse.json(ok(purchases));
}
