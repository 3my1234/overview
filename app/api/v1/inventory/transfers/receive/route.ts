import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser, prepareAuthStore } from '@/lib/server/auth-store';
import { receiveTransfer } from '@/lib/server/erp-store';

const receiveSchema = z.object({
  transferId: z.string().min(2),
  lines: z
    .array(
      z.object({
        lineId: z.string().min(2),
        quantityReceived: z.number().nonnegative(),
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
    const parsed = receiveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const received = await receiveTransfer({
      ...parsed.data,
      actorUserId: actor.id,
    });

    return NextResponse.json(ok(received, 'Transfer received successfully.'), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'transfer_receive_failed';

    if (message === 'transfer_not_found') {
      return NextResponse.json(fail('transfer_not_found', 'Transfer note not found.'), { status: 404 });
    }

    if (message === 'transfer_already_received') {
      return NextResponse.json(
        fail('transfer_already_received', 'This transfer has already been received.'),
        { status: 400 }
      );
    }

    if (message === 'transfer_lines_not_found') {
      return NextResponse.json(fail('transfer_lines_not_found', 'No lines found for this transfer.'), {
        status: 404,
      });
    }

    if (message === 'invalid_received_quantity') {
      return NextResponse.json(
        fail('invalid_received_quantity', 'Received quantity must be between 0 and sent quantity.'),
        { status: 400 }
      );
    }

    return NextResponse.json(fail('transfer_receive_failed', 'Unable to receive transfer.'), {
      status: 400,
    });
  }
}
