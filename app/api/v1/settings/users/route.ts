import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import {
  addUser,
  allowedCreatorToCreateRole,
  getSessionUser,
  getUsers,
  usernameExists,
} from '@/lib/server/in-memory-store';
import { Role } from '@/lib/types';

const createUserSchema = z.object({
  name: z.string().trim().min(3),
  username: z.string().trim().min(3),
  email: z.string().email(),
  role: z.enum(['admin', 'worker']),
  password: z.string().min(8),
  status: z.enum(['active', 'inactive']).default('active'),
  workerId: z.string().optional(),
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
  const sessionToken = readSessionToken(request);
  const actor = getSessionUser(sessionToken);
  if (!actor) {
    return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
  }

  if (!['super_admin', 'admin', 'ceo'].includes(actor.role)) {
    return NextResponse.json(fail('forbidden', 'Insufficient access level.'), {
      status: 403,
    });
  }

  return NextResponse.json(ok(getUsers()));
}

export async function POST(request: Request) {
  try {
    const sessionToken = readSessionToken(request);
    const actor = getSessionUser(sessionToken);

    if (!actor) {
      return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
    }

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    if (!allowedCreatorToCreateRole(actor.role, parsed.data.role as Role)) {
      return NextResponse.json(
        fail('forbidden', 'You do not have permission to create this role.'),
        { status: 403 }
      );
    }

    if (usernameExists(parsed.data.username)) {
      return NextResponse.json(fail('duplicate_username', 'Username already exists.'), {
        status: 409,
      });
    }

    const user = addUser(
      {
        name: parsed.data.name,
        username: parsed.data.username,
        email: parsed.data.email,
        role: parsed.data.role,
        status: parsed.data.status,
        workerId: parsed.data.workerId,
      },
      parsed.data.password,
      { mustChangePassword: true }
    );

    return NextResponse.json(ok(user, 'User created successfully.'), { status: 201 });
  } catch {
    return NextResponse.json(fail('invalid_json', 'Request body must be valid JSON.'), {
      status: 400,
    });
  }
}
