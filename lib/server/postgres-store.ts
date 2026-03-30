import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

import { Role, User, Worker } from '@/lib/types';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24;

let pool: Pool | null = null;
let initPromise: Promise<void> | null = null;

const bootstrapDefaults = {
  name: process.env.BOOTSTRAP_SUPER_ADMIN_NAME || 'Martin Obaze',
  username: process.env.BOOTSTRAP_SUPER_ADMIN_USERNAME || 'martin.obaze',
  email: process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || 'martin@palmcorp.com',
  password: process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD || 'Palm@123',
};

function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    });
  }

  return pool;
}

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email: row.email,
    role: row.role as Role,
    status: row.status,
    workerId: row.worker_id || undefined,
    createdAt: new Date(row.created_at),
  };
}

function mapWorker(row: any): Worker {
  return {
    id: row.id,
    employeeCode: row.employee_code,
    fullName: row.full_name,
    roleTitle: row.role_title,
    department: row.department,
    phone: row.phone,
    email: row.email || undefined,
    address: row.address,
    nextOfKinName: row.next_of_kin_name,
    nextOfKinPhone: row.next_of_kin_phone,
    hireDate: new Date(row.hire_date),
    employmentType: row.employment_type,
    locationType: row.location_type,
    locationId: row.location_id || undefined,
    monthlySalary: row.monthly_salary === null ? undefined : Number(row.monthly_salary),
    bankName: row.bank_name || undefined,
    bankAccountNumber: row.bank_account_number || undefined,
    governmentIdType: row.government_id_type || undefined,
    governmentIdNumber: row.government_id_number || undefined,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

export function isDatabaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

async function runMigrationsInternal() {
  const db = getPool();
  if (!db) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS app_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      worker_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      employee_code TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      role_title TEXT NOT NULL,
      department TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT NOT NULL,
      next_of_kin_name TEXT NOT NULL,
      next_of_kin_phone TEXT NOT NULL,
      hire_date TIMESTAMPTZ NOT NULL,
      employment_type TEXT NOT NULL,
      location_type TEXT NOT NULL,
      location_id TEXT,
      monthly_salary NUMERIC(14,2),
      bank_name TEXT,
      bank_account_number TEXT,
      government_id_type TEXT,
      government_id_number TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
      password_hash TEXT NOT NULL,
      must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);

  await db.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users (role);`);

  const existing = await db.query(
    `SELECT id FROM app_users WHERE role = 'super_admin' ORDER BY created_at ASC LIMIT 1;`
  );

  if (existing.rowCount === 0) {
    const id = `user_${Date.now()}`;
    const passwordHash = await bcrypt.hash(bootstrapDefaults.password, 10);
    await db.query(
      `INSERT INTO app_users (id, name, username, email, role, status) VALUES ($1, $2, $3, $4, 'super_admin', 'active')`,
      [id, bootstrapDefaults.name, bootstrapDefaults.username, bootstrapDefaults.email]
    );
    await db.query(
      `INSERT INTO user_credentials (user_id, password_hash, must_change_password) VALUES ($1, $2, $3)`,
      [id, passwordHash, false]
    );
  }
}

export async function ensureDatabaseReady() {
  if (!isDatabaseEnabled()) return;
  if (!initPromise) {
    initPromise = runMigrationsInternal();
  }
  await initPromise;
}

export async function findUserByIdentifier(identifier: string): Promise<User | null> {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) return null;

  const normalized = identifier.trim().toLowerCase();
  const result = await db.query(
    `SELECT * FROM app_users WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1`,
    [normalized]
  );

  if (!result.rowCount) return null;
  return mapUser(result.rows[0]);
}

export async function getUserById(userId: string): Promise<User | null> {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) return null;

  const result = await db.query(`SELECT * FROM app_users WHERE id = $1 LIMIT 1`, [userId]);
  if (!result.rowCount) return null;
  return mapUser(result.rows[0]);
}

export async function validateUserPassword(userId: string, password: string): Promise<boolean> {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) return false;

  const result = await db.query(
    `SELECT password_hash FROM user_credentials WHERE user_id = $1 LIMIT 1`,
    [userId]
  );
  if (!result.rowCount) return false;

  return bcrypt.compare(password, result.rows[0].password_hash);
}

export async function createSession(userId: string) {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) {
    throw new Error('database_not_available');
  }

  const token = crypto.randomUUID();
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);

  await db.query(
    `INSERT INTO user_sessions (token, user_id, created_at, expires_at) VALUES ($1, $2, $3, $4)`,
    [token, userId, createdAt.toISOString(), expiresAt.toISOString()]
  );

  return { token, expiresAt };
}

export async function getSessionUser(token?: string): Promise<User | null> {
  if (!token) return null;
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) return null;

  await db.query(`DELETE FROM user_sessions WHERE expires_at < NOW()`);

  const result = await db.query(
    `
      SELECT u.*
      FROM user_sessions s
      INNER JOIN app_users u ON u.id = s.user_id
      WHERE s.token = $1
      LIMIT 1
    `,
    [token]
  );

  if (!result.rowCount) return null;
  return mapUser(result.rows[0]);
}

export async function deleteSession(token?: string) {
  if (!token) return;
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) return;

  await db.query(`DELETE FROM user_sessions WHERE token = $1`, [token]);
}

export async function getUsers(): Promise<User[]> {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) return [];

  const result = await db.query(`SELECT * FROM app_users ORDER BY created_at DESC`);
  return result.rows.map(mapUser);
}

export async function usernameExists(username: string): Promise<boolean> {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) return false;

  const result = await db.query(`SELECT id FROM app_users WHERE LOWER(username) = $1 LIMIT 1`, [
    username.trim().toLowerCase(),
  ]);
  return Boolean(result.rowCount);
}

export async function addUser(
  payload: Omit<User, 'id' | 'createdAt'>,
  password: string,
  options?: { mustChangePassword?: boolean }
): Promise<User> {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) {
    throw new Error('database_not_available');
  }

  const id = `user_${Date.now()}`;
  const createdAt = new Date();
  const passwordHash = await bcrypt.hash(password, 10);

  await db.query(
    `
      INSERT INTO app_users (id, name, username, email, role, status, worker_id, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      id,
      payload.name,
      payload.username,
      payload.email,
      payload.role,
      payload.status,
      payload.workerId || null,
      createdAt.toISOString(),
    ]
  );

  await db.query(
    `INSERT INTO user_credentials (user_id, password_hash, must_change_password, updated_at) VALUES ($1, $2, $3, $4)`,
    [id, passwordHash, options?.mustChangePassword ?? true, createdAt.toISOString()]
  );

  return {
    id,
    ...payload,
    createdAt,
  };
}

export async function getWorkers(): Promise<Worker[]> {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) return [];

  const result = await db.query(`SELECT * FROM workers ORDER BY created_at DESC`);
  return result.rows.map(mapWorker);
}

export async function addWorker(worker: Worker): Promise<Worker> {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) {
    throw new Error('database_not_available');
  }

  await db.query(
    `
      INSERT INTO workers (
        id, employee_code, full_name, role_title, department, phone, email, address,
        next_of_kin_name, next_of_kin_phone, hire_date, employment_type, location_type,
        location_id, monthly_salary, bank_name, bank_account_number, government_id_type,
        government_id_number, status, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21
      )
    `,
    [
      worker.id,
      worker.employeeCode,
      worker.fullName,
      worker.roleTitle,
      worker.department,
      worker.phone,
      worker.email || null,
      worker.address,
      worker.nextOfKinName,
      worker.nextOfKinPhone,
      worker.hireDate.toISOString(),
      worker.employmentType,
      worker.locationType,
      worker.locationId || null,
      worker.monthlySalary ?? null,
      worker.bankName || null,
      worker.bankAccountNumber || null,
      worker.governmentIdType || null,
      worker.governmentIdNumber || null,
      worker.status,
      worker.createdAt.toISOString(),
    ]
  );

  return worker;
}

export async function getBootstrapSuperAdmin(): Promise<User | null> {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) return null;

  const result = await db.query(
    `SELECT * FROM app_users WHERE role = 'super_admin' ORDER BY created_at ASC LIMIT 1`
  );
  if (!result.rowCount) return null;
  return mapUser(result.rows[0]);
}

export async function updateSuperAdminAccount(input: {
  actorUserId: string;
  name: string;
  username: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  await ensureDatabaseReady();
  const db = getPool();
  if (!db) throw new Error('database_not_available');

  const actor = await getUserById(input.actorUserId);
  if (!actor || actor.role !== 'super_admin') {
    throw new Error('forbidden');
  }

  const duplicate = await db.query(
    `
      SELECT id FROM app_users
      WHERE (LOWER(username) = $1 OR LOWER(email) = $2) AND id <> $3
      LIMIT 1
    `,
    [input.username.toLowerCase(), input.email.toLowerCase(), actor.id]
  );

  if (duplicate.rowCount) {
    throw new Error('duplicate_identity');
  }

  await db.query(
    `UPDATE app_users SET name = $1, username = $2, email = $3 WHERE id = $4`,
    [input.name, input.username, input.email, actor.id]
  );

  if (input.newPassword) {
    if (!input.currentPassword) {
      throw new Error('current_password_required');
    }

    const valid = await validateUserPassword(actor.id, input.currentPassword);
    if (!valid) {
      throw new Error('invalid_current_password');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 10);
    await db.query(
      `UPDATE user_credentials SET password_hash = $1, must_change_password = false, updated_at = NOW() WHERE user_id = $2`,
      [passwordHash, actor.id]
    );
  }

  const updated = await getUserById(actor.id);
  if (!updated) {
    throw new Error('user_not_found');
  }
  return updated;
}
