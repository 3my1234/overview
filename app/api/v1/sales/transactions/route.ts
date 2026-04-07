import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser, prepareAuthStore } from '@/lib/server/auth-store';
import { createSalesTransaction, listSalesTransactions } from '@/lib/server/erp-store';

const salesSchema = z.object({
  date: z.string().optional(),
  customerName: z.string().trim().min(2),
  warehouseId: z.string().min(2),
  branchId: z.string().min(2),
  status: z.enum(['draft', 'submitted', 'approved', 'posted']).optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(2),
        quantity: z.number().positive(),
        unitPrice: z.number().positive().optional(),
      })
    )
    .min(1),
});

function readSessionToken(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.split('=')[1];
}

export async function GET() {
  return NextResponse.json(ok(await listSalesTransactions()));
}

export async function POST(request: Request) {
  await prepareAuthStore();
  const actor = await getSessionUser(readSessionToken(request));

  if (!actor) {
    return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
  }

  if (!['super_admin', 'admin', 'sales_manager', 'worker'].includes(actor.role)) {
    return NextResponse.json(fail('forbidden', 'Insufficient access level.'), { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = salesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const sale = await createSalesTransaction({
      ...parsed.data,
      actorUserId: actor.id,
    });

    return NextResponse.json(ok(sale, 'Sales transaction recorded successfully.'), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'sales_create_failed';

    if (message.startsWith('insufficient_stock:')) {
      const product = message.split(':')[1] || 'item';
      return NextResponse.json(
        fail('insufficient_stock', `Insufficient stock at branch for ${product}.`),
        { status: 400 }
      );
    }

    if (message === 'product_not_found') {
      return NextResponse.json(fail('product_not_found', 'One or more products were not found.'), {
        status: 404,
      });
    }

    return NextResponse.json(fail('sales_create_failed', 'Unable to post sales transaction.'), {
      status: 400,
    });
  }
}
