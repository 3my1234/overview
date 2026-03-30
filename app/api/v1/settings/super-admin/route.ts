import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser, prepareAuthStore, updateSuperAdminAccount } from '@/lib/server/auth-store';

const updateSchema = z.object({
  name: z.string().trim().min(3),
  username: z.string().trim().min(3),
  email: z.string().email(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).optional(),
});

function readSessionToken(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  return cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.split('=')[1];
}

export async function GET(request: Request) {
  await prepareAuthStore();
  const actor = await getSessionUser(readSessionToken(request));
  if (!actor) {
    return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
  }

  if (actor.role !== 'super_admin') {
    return NextResponse.json(fail('forbidden', 'Only super admin can access this resource.'), {
      status: 403,
    });
  }

  return NextResponse.json(
    ok({
      id: actor.id,
      name: actor.name,
      username: actor.username,
      email: actor.email,
      role: actor.role,
    })
  );
}

export async function PUT(request: Request) {
  await prepareAuthStore();
  const actor = await getSessionUser(readSessionToken(request));
  if (!actor) {
    return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
  }

  if (actor.role !== 'super_admin') {
    return NextResponse.json(fail('forbidden', 'Only super admin can update this resource.'), {
      status: 403,
    });
  }

  try {
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const updated = await updateSuperAdminAccount({
      actorUserId: actor.id,
      name: parsed.data.name,
      username: parsed.data.username,
      email: parsed.data.email,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });

    return NextResponse.json(
      ok(
        {
          id: updated.id,
          name: updated.name,
          username: updated.username,
          email: updated.email,
          role: updated.role,
        },
        'Super admin profile updated.'
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'update_failed';
    if (message === 'duplicate_identity') {
      return NextResponse.json(fail('duplicate_identity', 'Username or email already exists.'), {
        status: 409,
      });
    }

    if (message === 'invalid_current_password') {
      return NextResponse.json(fail('invalid_current_password', 'Current password is incorrect.'), {
        status: 400,
      });
    }

    if (message === 'current_password_required') {
      return NextResponse.json(
        fail('current_password_required', 'Current password is required to set a new password.'),
        { status: 400 }
      );
    }

    if (message === 'not_supported_without_database') {
      return NextResponse.json(
        fail('database_required', 'This action requires database-backed persistence.'),
        { status: 400 }
      );
    }

    return NextResponse.json(fail('update_failed', 'Unable to update super admin profile.'), {
      status: 400,
    });
  }
}
