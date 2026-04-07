import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { getUsers, getWorkers, prepareAuthStore } from '@/lib/server/auth-store';
import { getMasterDataBundle } from '@/lib/server/erp-store';

export async function GET() {
  await prepareAuthStore();
  const [users, workers, erp] = await Promise.all([getUsers(), getWorkers(), getMasterDataBundle()]);

  return NextResponse.json(
    ok({
      users,
      workers,
      warehouses: erp.warehouses,
      branches: erp.branches,
      products: erp.products,
      accounts: [],
    })
  );
}
