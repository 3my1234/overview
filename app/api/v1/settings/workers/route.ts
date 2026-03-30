import { NextResponse } from 'next/server';
import { z } from 'zod';

import { fail, ok } from '@/lib/api/envelope';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/constants';
import { addWorker, getWorkers } from '@/lib/server/in-memory-store';
import { getSessionUser } from '@/lib/server/in-memory-store';

const workerSchema = z.object({
  employeeCode: z.string().trim().min(3),
  fullName: z.string().trim().min(3),
  roleTitle: z.string().trim().min(2),
  department: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().trim().min(5),
  nextOfKinName: z.string().trim().min(3),
  nextOfKinPhone: z.string().trim().min(7),
  hireDate: z.string().datetime().or(z.string().date()),
  employmentType: z.enum(['full_time', 'contract', 'casual']),
  locationType: z.enum(['warehouse', 'branch', 'hq']),
  locationId: z.string().optional(),
  monthlySalary: z.number().nonnegative().optional(),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  governmentIdType: z.enum(['nin', 'voters_card', 'drivers_license', 'passport']).optional(),
  governmentIdNumber: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionToken = cookieHeader
    .split(';')
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${AUTH_SESSION_COOKIE}=`))
    ?.split('=')[1];

  const actor = getSessionUser(sessionToken);
  if (!actor) {
    return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
  }

  if (!['super_admin', 'admin', 'ceo'].includes(actor.role)) {
    return NextResponse.json(fail('forbidden', 'Insufficient access level.'), {
      status: 403,
    });
  }

  return NextResponse.json(ok(getWorkers()));
}

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const sessionToken = cookieHeader
      .split(';')
      .map((chunk) => chunk.trim())
      .find((chunk) => chunk.startsWith(`${AUTH_SESSION_COOKIE}=`))
      ?.split('=')[1];

    const actor = getSessionUser(sessionToken);
    if (!actor) {
      return NextResponse.json(fail('unauthorized', 'Login required.'), { status: 401 });
    }

    if (actor.role !== 'super_admin' && actor.role !== 'admin') {
      return NextResponse.json(
        fail('forbidden', 'Only super admin or admin can create worker records.'),
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = workerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(fail('invalid_payload', parsed.error.message), { status: 400 });
    }

    const worker = addWorker({
      id: `worker_${Date.now()}`,
      employeeCode: parsed.data.employeeCode,
      fullName: parsed.data.fullName,
      roleTitle: parsed.data.roleTitle,
      department: parsed.data.department,
      phone: parsed.data.phone,
      email: parsed.data.email || undefined,
      address: parsed.data.address,
      nextOfKinName: parsed.data.nextOfKinName,
      nextOfKinPhone: parsed.data.nextOfKinPhone,
      hireDate: new Date(parsed.data.hireDate),
      employmentType: parsed.data.employmentType,
      locationType: parsed.data.locationType,
      locationId: parsed.data.locationId,
      monthlySalary: parsed.data.monthlySalary,
      bankName: parsed.data.bankName,
      bankAccountNumber: parsed.data.bankAccountNumber,
      governmentIdType: parsed.data.governmentIdType,
      governmentIdNumber: parsed.data.governmentIdNumber,
      status: parsed.data.status,
      createdAt: new Date(),
    });

    return NextResponse.json(ok(worker, 'Worker created successfully.'), { status: 201 });
  } catch {
    return NextResponse.json(fail('invalid_json', 'Request body must be valid JSON.'), {
      status: 400,
    });
  }
}
