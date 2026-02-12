import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a password with bcrypt (for signup step2).
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a plain password with a bcrypt hash (e.g. for login).
 */
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(plainPassword, hashedPassword);
}
