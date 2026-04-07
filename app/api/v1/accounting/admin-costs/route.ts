import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser, prepareAuthStore } from '@/lib/server/auth-store';
import { createAdminCost, listAdminCostSummaries } from '@/lib/server/erp-store';

const adminCostSchema = z.object({
  date: z.string().optional(),
  code: z.string().trim().min(3),
  description: z.string().trim().min(3),
  amount: z.number().positive(),
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
  return NextResponse.json(ok(await listAdminCostSummaries()));
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
    const parsed = adminCostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const record = await createAdminCost({
      ...parsed.data,
      actorUserId: actor.id,
    });

    return NextResponse.json(ok(record, 'Administrative cost posted successfully.'), {
      status: 201,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'admin_cost_failed';

    if (message === 'expense_code_not_found') {
      return NextResponse.json(fail('expense_code_not_found', 'Expense code not found.'), {
        status: 404,
      });
    }

    return NextResponse.json(fail('admin_cost_failed', 'Unable to post administrative cost.'), {
      status: 400,
    });
  }
}
