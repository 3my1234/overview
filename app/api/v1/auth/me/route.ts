import { NextResponse } from 'next/server';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { getSessionUser } from '@/lib/server/in-memory-store';

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionToken = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.split('=')[1];

  const user = getSessionUser(sessionToken);
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
