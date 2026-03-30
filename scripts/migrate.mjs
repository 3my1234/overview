import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.log('[migrate] DATABASE_URL is not set. Skipping migrations.');
  process.exit(0);
}

const bootstrapDefaults = {
  name: process.env.BOOTSTRAP_SUPER_ADMIN_NAME || 'Martin Obaze',
  username: process.env.BOOTSTRAP_SUPER_ADMIN_USERNAME || 'martin.obaze',
  email: process.env.BOOTSTRAP_SUPER_ADMIN_EMAIL || 'martin@palmcorp.com',
  password: process.env.BOOTSTRAP_SUPER_ADMIN_PASSWORD || 'Palm@123',
};

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function run() {
  console.log('[migrate] Running database migrations...');

  await pool.query(`
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

  await pool.query(`
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

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_credentials (
      user_id TEXT PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
      password_hash TEXT NOT NULL,
      must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions (expires_at);`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users (role);`);

  const existing = await pool.query(
    `SELECT id FROM app_users WHERE role = 'super_admin' ORDER BY created_at ASC LIMIT 1;`
  );

  if (!existing.rowCount) {
    const id = `user_${Date.now()}`;
    const passwordHash = await bcrypt.hash(bootstrapDefaults.password, 10);

    await pool.query(
      `INSERT INTO app_users (id, name, username, email, role, status) VALUES ($1, $2, $3, $4, 'super_admin', 'active')`,
      [id, bootstrapDefaults.name, bootstrapDefaults.username, bootstrapDefaults.email]
    );

    await pool.query(
      `INSERT INTO user_credentials (user_id, password_hash, must_change_password) VALUES ($1, $2, $3)`,
      [id, passwordHash, false]
    );

    console.log('[migrate] Seeded bootstrap super admin account.');
  } else {
    console.log('[migrate] Super admin already exists. Seed skipped.');
  }

  console.log('[migrate] Migrations completed.');
}

run()
  .catch((error) => {
    console.error('[migrate] Migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
