/**
 * Sync code generation, validation, and shared types.
 * Uses only unambiguous characters (no 0/O, 1/I/L)
 */

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Regex for validating generated sync codes (strict: unambiguous charset, exactly 6 chars) */
export const SYNC_CODE_REGEX = /^AZ-[A-HJ-KM-NP-Z2-9]{6}$/;

/** Regex for validating user-defined custom sync codes (any alphanumeric, 3–8 chars after AZ-) */
export const CUSTOM_SYNC_CODE_REGEX = /^AZ-[A-Z0-9]{3,8}$/;

/** TTL for sync data in Redis (90 days) */
export const SYNC_TTL_SECONDS = 90 * 24 * 60 * 60;

/** Shape of data stored in Redis for each sync code */
export interface SyncData {
  quizProgress: Record<string, unknown>;
  answeredQuestions: Record<string, unknown>;
  leitnerProgress: Record<string, unknown>;
  settings: Record<string, unknown>;
  /** User activity data: study-streak, daily-brief-last-shown */
  activity: Record<string, unknown>;
  lastSync?: string;
}

export function generateSyncCode(): string {
  const chars: string[] = [];
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * CHARSET.length);
    chars.push(CHARSET[randomIndex]);
  }
  return `AZ-${chars.join('')}`;
}

/**
 * Validate a generated sync code (strict: unambiguous charset, exactly 6 chars).
 * Use this for server-side validation and code-generation checks.
 */
export function isValidSyncCode(code: string): boolean {
  return SYNC_CODE_REGEX.test(code.toUpperCase());
}

/**
 * Validate a user-entered sync code.
 * Accepts both generated codes (strict charset) and user-defined custom codes
 * such as AZ-FABIAN (any alphanumeric, 3–8 chars after AZ-).
 * Use this for UI restore/rename inputs.
 */
export function isValidCustomSyncCode(code: string): boolean {
  return CUSTOM_SYNC_CODE_REGEX.test(code.toUpperCase());
}
