/**
 * Sync Client — Simple hash-key based sync
 *
 * No login, no device IDs. Just a short sync code like "AZ-X7K9M2".
 * Push your progress, pull it on another device.
 */

import type { SyncData } from './generate-sync-code';
export type { SyncData } from './generate-sync-code';

export interface SyncResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: SyncData | null;
  lastSync?: string | null;
}

const SYNC_CODE_KEY = 'quiz_sync_code';
const LAST_SYNC_KEY = 'quiz_last_sync';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed =
    typeof value === 'number' ? value : parseFloat(String(value ?? fallback));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mergeLeitnerQuestionProgress(
  local: Record<string, unknown>,
  remote: Record<string, unknown>
): Record<string, unknown> {
  const localReviewed = new Date(String(local.lastReviewed ?? 0)).getTime();
  const remoteReviewed = new Date(String(remote.lastReviewed ?? 0)).getTime();
  const hasRemoteNewer = remoteReviewed > localReviewed;
  const source = hasRemoteNewer ? remote : local;

  return {
    ...source,
    questionId: String(local.questionId ?? remote.questionId ?? ''),
    timesCorrect: Math.max(
      toNumber(local.timesCorrect),
      toNumber(remote.timesCorrect)
    ),
    timesIncorrect: Math.max(
      toNumber(local.timesIncorrect),
      toNumber(remote.timesIncorrect)
    ),
  };
}

function mergeLeitnerProgressBlob(local: unknown, remote: unknown): unknown {
  if (!isRecord(local) || !isRecord(remote)) {
    return local ?? remote;
  }

  const merged: Record<string, unknown> = { ...local };
  for (const [questionId, remoteProgress] of Object.entries(remote)) {
    const localProgress = merged[questionId];
    if (!isRecord(localProgress) || !isRecord(remoteProgress)) {
      if (!(questionId in merged)) merged[questionId] = remoteProgress;
      continue;
    }
    merged[questionId] = mergeLeitnerQuestionProgress(
      localProgress,
      remoteProgress
    );
  }
  return merged;
}

function mergeSubmissionStates(local: unknown, remote: unknown): unknown {
  if (!isRecord(local) || !isRecord(remote)) return local ?? remote;

  const merged: Record<string, unknown> = { ...local };
  for (const [questionId, remoteState] of Object.entries(remote)) {
    const localState = merged[questionId];
    if (!isRecord(localState) || !isRecord(remoteState)) {
      if (!(questionId in merged)) merged[questionId] = remoteState;
      continue;
    }

    const localSubmittedAt = toNumber(localState.submittedAt, 0);
    const remoteSubmittedAt = toNumber(remoteState.submittedAt, 0);
    merged[questionId] =
      remoteSubmittedAt > localSubmittedAt ? remoteState : localState;
  }
  return merged;
}

function mergeCurrentSession(local: unknown, remote: unknown): unknown {
  if (!isRecord(local) || !isRecord(remote)) return local ?? remote;
  const localCreatedAt = toNumber(local.createdAt, 0);
  const remoteCreatedAt = toNumber(remote.createdAt, 0);
  return remoteCreatedAt > localCreatedAt ? remote : local;
}

function mergeLeitnerValue(
  key: string,
  local: unknown,
  remote: unknown
): unknown {
  if (key === 'leitner-progress') {
    return mergeLeitnerProgressBlob(local, remote);
  }

  if (key.startsWith('leitner-daily-attempts-')) {
    return Math.max(toNumber(local, 0), toNumber(remote, 0));
  }

  if (key === 'leitner-submission-states') {
    return mergeSubmissionStates(local, remote);
  }

  if (key === 'leitner-current-session') {
    return mergeCurrentSession(local, remote);
  }

  if (key === 'leitner-quiz-index') {
    return Math.max(toNumber(local, 0), toNumber(remote, 0));
  }

  return local ?? remote;
}

/**
 * Get the stored sync code from localStorage
 */
export function getStoredSyncCode(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SYNC_CODE_KEY);
}

/**
 * Store a sync code in localStorage
 */
export function storeSyncCode(code: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SYNC_CODE_KEY, code.toUpperCase());
}

/**
 * Get last sync timestamp
 */
export function getLastSyncTime(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

/**
 * Collect all quiz-related data from localStorage using an explicit allowlist.
 * Only syncs keys that are actively used by the app.
 */
export function collectLocalData(): SyncData {
  /** Keys that hold user activity data (streaks, daily brief state) */
  const ACTIVITY_KEYS = ['study-streak', 'daily-brief-last-shown'];

  const data: SyncData = {
    quizProgress: {},
    answeredQuestions: {},
    leitnerProgress: {},
    settings: {},
    activity: {},
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Skip our own sync metadata
    if (key === SYNC_CODE_KEY || key === LAST_SYNC_KEY) continue;

    try {
      const value = localStorage.getItem(key);
      if (!value) continue;

      if (key.startsWith('leitner-')) {
        // All live leitner keys: progress, settings, sessions, daily attempts
        data.leitnerProgress[key] = JSON.parse(value);
      } else if (key === 'theme') {
        data.settings[key] = value; // theme is a plain string, not JSON
      } else if (ACTIVITY_KEYS.includes(key)) {
        data.activity[key] = JSON.parse(value);
      }
      // Dead keys (quiz_progress_*, quiz-*, quiz_answered_global, leitner-stats)
      // are intentionally NOT collected — they are cleaned up by storage-migration.ts
    } catch {
      // Skip unparseable values
    }
  }

  return data;
}

/**
 * Write synced data into localStorage.
 * Only applies live buckets (leitner, settings, activity).
 * Legacy buckets (quizProgress, answeredQuestions) are ignored on apply
 * but still accepted from Redis for backward compatibility.
 */
function applyData(data: SyncData): void {
  // Leitner progress
  if (data.leitnerProgress) {
    for (const [key, value] of Object.entries(data.leitnerProgress)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  // Settings
  if (data.settings) {
    for (const [key, value] of Object.entries(data.settings)) {
      if (key === 'theme') {
        localStorage.setItem(key, value as string);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    }
  }

  // Activity data (streaks, daily brief state)
  if (data.activity) {
    for (const [key, value] of Object.entries(data.activity)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
}

/**
 * Push local data to the cloud under a sync code
 */
export async function pushData(syncCode: string): Promise<SyncResponse> {
  const localData = collectLocalData();

  const response = await fetch(`/api/sync/${syncCode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(localData),
  });

  if (!response.ok) {
    throw new Error(`Push failed: ${response.statusText}`);
  }

  const result: SyncResponse = await response.json();

  if (result.success && result.lastSync) {
    localStorage.setItem(LAST_SYNC_KEY, result.lastSync);
    storeSyncCode(syncCode);
  }

  return result;
}

/**
 * Pull data from the cloud and apply it locally
 */
export async function pullData(syncCode: string): Promise<SyncResponse> {
  const response = await fetch(`/api/sync/${syncCode}`);

  if (!response.ok) {
    return { success: false, error: response.statusText };
  }

  const result: SyncResponse = await response.json();

  if (result.success && result.data) {
    applyData(result.data);
    storeSyncCode(syncCode);
    if (result.lastSync) {
      localStorage.setItem(LAST_SYNC_KEY, result.lastSync);
    }
  }

  return result;
}

/**
 * Sync local progress to the cloud with a smart pull-then-push merge.
 * - Pulls remote data first.
 * - Merges with local data (union arrays for answers, local wins for progress).
 * - Applies the merged result locally, then pushes it to the cloud.
 * Safe to call repeatedly.
 */
export async function sync(syncCode: string): Promise<SyncResponse> {
  // Step 1: Pull remote data (non-throwing)
  let remoteData: SyncData | null = null;
  try {
    const pullResponse = await fetch(`/api/sync/${syncCode}`);
    if (pullResponse.ok) {
      const pullResult: SyncResponse = await pullResponse.json();
      if (pullResult.success && pullResult.data) {
        remoteData = pullResult.data;
      }
    }
  } catch {
    // Pull failed — proceed with local-only push
  }

  // Step 2: Collect current local data
  const localData = collectLocalData();

  // Step 3: Merge remote into local (only live buckets)
  if (remoteData) {
    // Merge leitner keys by key semantics (progress/session/index/daily attempts)
    if (remoteData.leitnerProgress) {
      for (const [key, value] of Object.entries(remoteData.leitnerProgress)) {
        if (!(key in localData.leitnerProgress)) {
          localData.leitnerProgress[key] = value;
        } else {
          localData.leitnerProgress[key] = mergeLeitnerValue(
            key,
            localData.leitnerProgress[key],
            value
          );
        }
      }
    }

    // Merge settings (local wins when both define same key)
    if (remoteData.settings) {
      if (!localData.settings) localData.settings = {};
      for (const [key, value] of Object.entries(remoteData.settings)) {
        if (!(key in localData.settings)) {
          localData.settings[key] = value;
        }
      }
    }

    // Merge activity data (streaks: pick the higher values; other keys: local wins)
    if (remoteData.activity) {
      if (!localData.activity) localData.activity = {};
      for (const [key, value] of Object.entries(remoteData.activity)) {
        if (key === 'study-streak' && key in localData.activity) {
          // Only merge bestStreak (high-water mark) and lastStudyDate.
          // currentStreak is always recomputed from Leitner review dates
          // at read time — syncing it would resurrect dead streaks.
          const local = localData.activity[key] as Record<string, unknown>;
          const remote = value as Record<string, unknown>;
          localData.activity[key] = {
            ...local,
            bestStreak: Math.max(
              (local.bestStreak as number) || 0,
              (remote.bestStreak as number) || 0
            ),
            // Keep the more recent lastStudyDate
            lastStudyDate:
              (local.lastStudyDate as string) &&
              (remote.lastStudyDate as string)
                ? (local.lastStudyDate as string) >=
                  (remote.lastStudyDate as string)
                  ? local.lastStudyDate
                  : remote.lastStudyDate
                : (local.lastStudyDate as string) ||
                  (remote.lastStudyDate as string),
          };
        } else if (
          key === 'daily-brief-last-shown' &&
          key in localData.activity
        ) {
          const localDate = String(localData.activity[key] || '');
          const remoteDate = String(value || '');
          localData.activity[key] =
            localDate >= remoteDate ? localDate : remoteDate;
        } else if (!(key in localData.activity)) {
          localData.activity[key] = value;
        }
      }
    }

    // Apply merged data to localStorage
    applyData(localData);
  }

  // Step 4: Push merged (or local-only) data
  const pushResponse = await fetch(`/api/sync/${syncCode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(localData),
  });

  if (!pushResponse.ok) {
    throw new Error(`Push failed: ${pushResponse.statusText}`);
  }

  const result: SyncResponse = await pushResponse.json();

  if (result.success && result.lastSync) {
    localStorage.setItem(LAST_SYNC_KEY, result.lastSync);
    storeSyncCode(syncCode);
  }

  return result;
}
