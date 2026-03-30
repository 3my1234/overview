import { NextResponse } from 'next/server';

import { ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { deleteSession } from '@/lib/server/in-memory-store';

export async function POST(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionToken = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.split('=')[1];

  deleteSession(sessionToken);

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
