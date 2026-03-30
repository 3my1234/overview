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
    if (!user || !(await validateUserPassword(user.id, parsed.data.password))) {
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
