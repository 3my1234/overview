import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import {
  createSession,
  findUserByIdentifier,
  getBootstrapSuperAdmin,
  prepareAuthStore,
  validateUserPassword,
} from '@/lib/server/auth-store';

const loginSchema = z.object({
  identifier: z.string().trim().min(3),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    await prepareAuthStore();
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const user = await findUserByIdentifier(parsed.data.identifier);
    if (!user) {
      console.warn(`[auth] login failed: user_not_found identifier=${parsed.data.identifier}`);
      return NextResponse.json(fail('invalid_credentials', 'Invalid login details.'), {
        status: 401,
      });
    }

    if (user.status !== 'active') {
      console.warn(`[auth] login failed: inactive_user user=${user.username}`);
      return NextResponse.json(fail('account_inactive', 'This account is inactive.'), {
        status: 403,
      });
    }

    const isValidPassword = await validateUserPassword(user.id, parsed.data.password);
    if (!isValidPassword) {
      console.warn(`[auth] login failed: invalid_password user=${user.username}`);
      return NextResponse.json(fail('invalid_credentials', 'Invalid login details.'), {
        status: 401,
      });
    }

    const session = await createSession(user.id);
    const response = NextResponse.json(
      ok({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
      })
    );

    response.cookies.set(AUTH_SESSION_COOKIE, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      expires: session.expiresAt,
      path: '/',
    });

    console.info(`[auth] login success: user=${user.username} role=${user.role}`);
    return response;
  } catch {
    const bootstrapUser = await getBootstrapSuperAdmin();
    return NextResponse.json(
      fail(
        'login_failed',
        bootstrapUser
          ? 'Unable to process login at the moment.'
          : 'System bootstrap user is not configured.'
      ),
      { status: 400 }
    );
  }
}
