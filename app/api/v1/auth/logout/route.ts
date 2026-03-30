import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { deleteSession, prepareAuthStore } from '@/lib/server/auth-store';

export async function POST(request: Request) {
  await prepareAuthStore();
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionToken = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.split('=')[1];

  await deleteSession(sessionToken);

  const response = NextResponse.json(ok({ loggedOut: true }));
  response.cookies.set(AUTH_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    expires: new Date(0),
    path: '/',
  });

  return response;
}
