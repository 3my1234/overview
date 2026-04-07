import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser, prepareAuthStore } from '@/lib/server/auth-store';
import { createAsset, listAssets } from '@/lib/server/erp-store';

const assetSchema = z.object({
  assetCode: z.string().trim().min(3),
  name: z.string().trim().min(3),
  category: z.string().trim().min(2),
  acquiredDate: z.string().optional(),
  acquisitionCost: z.number().positive(),
  usefulLifeYears: z.number().positive(),
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
  return NextResponse.json(ok(await listAssets()));
}

export async function POST(request: Request) {
  await prepareAuthStore();
  const actor = await getSessionUser(readSessionToken(request));

  if (!actor) {
    return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
  }

  if (!['super_admin', 'admin', 'accountant'].includes(actor.role)) {
    return NextResponse.json(fail('forbidden', 'Insufficient access level.'), { status: 403 });
  }

  try {
    const body = await request.json();
    const parsed = assetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const asset = await createAsset({
      ...parsed.data,
      actorUserId: actor.id,
    });

    return NextResponse.json(ok(asset, 'Asset recorded successfully.'), { status: 201 });
  } catch {
    return NextResponse.json(fail('asset_create_failed', 'Unable to create asset record.'), {
      status: 400,
    });
  }
}
