import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser, prepareAuthStore } from '@/lib/server/auth-store';
import { createProduct, listProducts } from '@/lib/server/erp-store';

const productSchema = z.object({
  name: z.string().trim().min(2),
  sku: z.string().trim().min(2),
  category: z.enum(['raw_oil', 'packaging', 'consumable', 'finished_goods', 'other']),
  unit: z.enum(['litres', 'drums', 'tonnes', 'bags']),
  unitPrice: z.number().nonnegative(),
  standardCost: z.number().nonnegative(),
  reorderLevel: z.number().nonnegative(),
  status: z.enum(['active', 'discontinued']).optional(),
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
  return NextResponse.json(ok(await listProducts()));
}

export async function POST(request: Request) {
  await prepareAuthStore();
  const actor = await getSessionUser(readSessionToken(request));

  if (!actor) {
    return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
  }

  if (!['super_admin', 'admin', 'warehouse_manager'].includes(actor.role)) {
    return NextResponse.json(fail('forbidden', 'Insufficient access level.'), { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = productSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const product = await createProduct(parsed.data);
    return NextResponse.json(ok(product, 'Product created successfully.'), { status: 201 });
  } catch {
    return NextResponse.json(fail('product_create_failed', 'Unable to create product.'), { status: 400 });
  }
}
