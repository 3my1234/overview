import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser, prepareAuthStore } from '@/lib/server/auth-store';
import { createTransfer, listTransfers } from '@/lib/server/erp-store';

const transferSchema = z.object({
  date: z.string().optional(),
  fromWarehouseId: z.string().min(2),
  toBranchId: z.string().min(2),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        productId: z.string().min(2),
        quantity: z.number().positive(),
        unitCost: z.number().nonnegative().optional(),
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
  return NextResponse.json(ok(await listTransfers()));
}

export async function POST(request: Request) {
  await prepareAuthStore();
  const actor = await getSessionUser(readSessionToken(request));

  if (!actor) {
    return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
  }

  if (!['super_admin', 'admin', 'warehouse_manager', 'worker'].includes(actor.role)) {
    return NextResponse.json(fail('forbidden', 'Insufficient access level.'), { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = transferSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const transfer = await createTransfer({
      ...parsed.data,
      actorUserId: actor.id,
    });

    return NextResponse.json(ok(transfer, 'Transfer note created successfully.'), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'transfer_create_failed';

    if (message === 'product_not_found') {
      return NextResponse.json(fail('product_not_found', 'One or more products were not found.'), {
        status: 404,
      });
    }

    if (message.startsWith('insufficient_stock:')) {
      const product = message.split(':')[1] || 'item';
      return NextResponse.json(
        fail('insufficient_stock', `Insufficient stock at source warehouse for ${product}.`),
        { status: 400 }
      );
    }

    if (message === 'at_least_one_line_required') {
      return NextResponse.json(
        fail('at_least_one_line_required', 'At least one transfer line is required.'),
        { status: 400 }
      );
    }

    return NextResponse.json(fail('transfer_create_failed', 'Unable to create transfer note.'), {
      status: 400,
    });
  }
}
