import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser, prepareAuthStore } from '@/lib/server/auth-store';
import { createProduction, listProductionRecords } from '@/lib/server/erp-store';

const productionSchema = z.object({
  date: z.string().optional(),
  warehouseId: z.string().min(2),
  outputProductId: z.string().min(2),
  outputQuantity: z.number().positive(),
  overheadCost: z.number().nonnegative().optional(),
  referenceDocument: z.string().optional(),
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
  return NextResponse.json(ok(await listProductionRecords()));
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
    const parsed = productionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const production = await createProduction({
      ...parsed.data,
      actorUserId: actor.id,
    });

    return NextResponse.json(ok(production, 'Production posted successfully.'), { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'production_failed';

    if (message === 'output_product_not_found') {
      return NextResponse.json(fail('output_product_not_found', 'Output product not found.'), {
        status: 404,
      });
    }

    if (message === 'bom_not_configured') {
      return NextResponse.json(
        fail('bom_not_configured', 'No active BOM recipe configured for this product.'),
        { status: 400 }
      );
    }

    if (message.startsWith('insufficient_component:')) {
      const component = message.split(':')[1] || 'component';
      return NextResponse.json(
        fail('insufficient_component', `Insufficient component stock for ${component}.`),
        { status: 400 }
      );
    }

    return NextResponse.json(fail('production_failed', 'Unable to post production.'), {
      status: 400,
    });
  }
}
