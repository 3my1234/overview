import {
  addUser as addInMemoryUser,
  addWorker as addInMemoryWorker,
  allowedCreatorToCreateRole as inMemoryAllowedCreatorToCreateRole,
  createSession as createInMemorySession,
  deleteSession as deleteInMemorySession,
  findUserByIdentifier as findInMemoryUserByIdentifier,
  getBootstrapSuperAdmin as getInMemoryBootstrapSuperAdmin,
  getSessionUser as getInMemorySessionUser,
  getUsers as getInMemoryUsers,
  getWorkers as getInMemoryWorkers,
  usernameExists as inMemoryUsernameExists,
  validateUserPassword as validateInMemoryPassword,
} from '@/lib/server/in-memory-store';
import {
  addUser as addDbUser,
  addWorker as addDbWorker,
  createSession as createDbSession,
  deleteSession as deleteDbSession,
  ensureDatabaseReady,
  findUserByIdentifier as findDbUserByIdentifier,
  getBootstrapSuperAdmin as getDbBootstrapSuperAdmin,
  getSessionUser as getDbSessionUser,
  getUsers as getDbUsers,
  getWorkers as getDbWorkers,
  isDatabaseEnabled,
  updateSuperAdminAccount as updateDbSuperAdminAccount,
  usernameExists as dbUsernameExists,
  validateUserPassword as validateDbPassword,
} from '@/lib/server/postgres-store';
import { Role, User, Worker } from '@/lib/types';

export async function prepareAuthStore() {
  if (isDatabaseEnabled()) {
    await ensureDatabaseReady();
  }
}

export async function findUserByIdentifier(identifier: string) {
  if (isDatabaseEnabled()) return findDbUserByIdentifier(identifier);
  return findInMemoryUserByIdentifier(identifier);
}

export async function validateUserPassword(userId: string, password: string) {
  if (isDatabaseEnabled()) return validateDbPassword(userId, password);
  return validateInMemoryPassword(userId, password);
}

export async function createSession(userId: string) {
  if (isDatabaseEnabled()) return createDbSession(userId);
  return createInMemorySession(userId);
}

export async function getSessionUser(token?: string) {
  if (isDatabaseEnabled()) return getDbSessionUser(token);
  return getInMemorySessionUser(token);
}

export async function deleteSession(token?: string) {
  if (isDatabaseEnabled()) return deleteDbSession(token);
  return deleteInMemorySession(token);
}

export async function getUsers() {
  if (isDatabaseEnabled()) return getDbUsers();
  return getInMemoryUsers();
}

export async function getWorkers() {
  if (isDatabaseEnabled()) return getDbWorkers();
  return getInMemoryWorkers();
}

export async function usernameExists(username: string) {
  if (isDatabaseEnabled()) return dbUsernameExists(username);
  return inMemoryUsernameExists(username);
}

export async function addUser(
  payload: Omit<User, 'id' | 'createdAt'>,
  password: string,
  options?: { mustChangePassword?: boolean }
) {
  if (isDatabaseEnabled()) return addDbUser(payload, password, options);
  return addInMemoryUser(payload, password, options);
}

export async function addWorker(worker: Worker) {
  if (isDatabaseEnabled()) return addDbWorker(worker);
  return addInMemoryWorker(worker);
}

export async function getBootstrapSuperAdmin() {
  if (isDatabaseEnabled()) return getDbBootstrapSuperAdmin();
  return getInMemoryBootstrapSuperAdmin();
}

export async function updateSuperAdminAccount(input: {
  actorUserId: string;
  name: string;
  username: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
}) {
  if (isDatabaseEnabled()) {
    return updateDbSuperAdminAccount(input);
  }

  throw new Error('not_supported_without_database');
}

export function allowedCreatorToCreateRole(creatorRole: Role, targetRole: Role) {
  return inMemoryAllowedCreatorToCreateRole(creatorRole, targetRole);
}
