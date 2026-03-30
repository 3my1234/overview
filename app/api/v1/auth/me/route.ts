import { NextResponse } from 'next/server';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser, prepareAuthStore } from '@/lib/server/auth-store';

export async function GET(request: Request) {
  await prepareAuthStore();
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionToken = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.split('=')[1];

  const user = await getSessionUser(sessionToken);
  if (!user) {
    return NextResponse.json(fail('unauthorized', 'No active session.'), { status: 401 });
  }

  return NextResponse.json(
    ok({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
    })
  );
}
