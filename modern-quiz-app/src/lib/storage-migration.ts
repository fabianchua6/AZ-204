/**
 * Storage Migration — one-time cleanup of dead/orphaned localStorage keys.
 *
 * Gated by `storage-schema-version`. Runs once per browser, idempotent.
 *
 * Dead keys being removed:
 *  - quiz-learning-records   (from deleted use-smart-learning hook)
 *  - quiz-study-sessions     (from deleted use-smart-learning hook)
 *  - quiz-smart-settings     (from deleted use-smart-learning hook)
 *  - quiz-leitner-state      (legacy quiz practice state)
 *  - quiz-practice-state     (legacy quiz practice state)
 *  - quiz_answered_global    (ghost key — perpetuated by sync round-trips)
 *  - leitner-stats           (legacy key removed from LEITNER_CONFIG)
 *  - quiz_progress_*         (all old per-topic quiz progress keys)
 *
 * Also migrates study-streak.lastStudyDate from `Date.toDateString()` format
 * (e.g. "Thu Feb 19 2026") to ISO `YYYY-MM-DD` (e.g. "2026-02-19").
 */

const SCHEMA_VERSION_KEY = 'storage-schema-version';
const CURRENT_VERSION = '2';

/** Exact keys to remove unconditionally */
const DEAD_EXACT_KEYS = [
  'quiz-learning-records',
  'quiz-study-sessions',
  'quiz-smart-settings',
  'quiz-leitner-state',
  'quiz-practice-state',
  'quiz_answered_global',
  'leitner-stats',
] as const;

/** Prefixes: any key starting with these is removed */
const DEAD_PREFIXES = ['quiz_progress_'] as const;

/**
 * Run the one-time storage migration.
 * Safe to call on every page load — exits immediately if already at current version.
 */
export function runStorageMigration(): void {
  if (typeof window === 'undefined') return;

  const version = localStorage.getItem(SCHEMA_VERSION_KEY);
  if (version === CURRENT_VERSION) return;

  // 1. Remove dead exact keys
  for (const key of DEAD_EXACT_KEYS) {
    localStorage.removeItem(key);
  }

  // 2. Remove dead prefix keys (must iterate in reverse to avoid index shifting)
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    for (const prefix of DEAD_PREFIXES) {
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
        break;
      }
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }

  // 3. Migrate study-streak date format: toDateString() → YYYY-MM-DD
  migrateStudyStreakDateFormat();

  // 4. Stamp the version
  localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_VERSION);
}

/**
 * Convert study-streak.lastStudyDate from `Date.toDateString()` format
 * (e.g. "Thu Feb 19 2026") to ISO "YYYY-MM-DD" format.
 * No-op if the value is already ISO or missing.
 */
function migrateStudyStreakDateFormat(): void {
  try {
    const raw = localStorage.getItem('study-streak');
    if (!raw) return;

    const streak = JSON.parse(raw);
    if (!streak.lastStudyDate || typeof streak.lastStudyDate !== 'string')
      return;

    // Already in YYYY-MM-DD format — skip
    if (/^\d{4}-\d{2}-\d{2}$/.test(streak.lastStudyDate)) return;

    // Try parsing the old toDateString() format → convert to ISO date
    const parsed = new Date(streak.lastStudyDate);
    if (isNaN(parsed.getTime())) return;

    streak.lastStudyDate = parsed.toLocaleDateString('en-CA'); // YYYY-MM-DD
    localStorage.setItem('study-streak', JSON.stringify(streak));
  } catch {
    // Malformed data — leave as-is, will be overwritten on next study day
  }
}
