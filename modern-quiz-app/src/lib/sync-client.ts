/**
 * Sync Client — Simple hash-key based sync
 *
 * No login, no device IDs. Just a short sync code like "AZ-X7K9M2".
 * Push your progress, pull it on another device.
 */

export interface SyncData {
  quizProgress: Record<string, unknown>;
  answeredQuestions: Record<string, unknown>;
  leitnerProgress: Record<string, unknown>;
  settings: Record<string, unknown>;
  lastSync?: string;
}

export interface SyncResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: SyncData | null;
  lastSync?: string | null;
}

const SYNC_CODE_KEY = 'quiz_sync_code';
const LAST_SYNC_KEY = 'quiz_last_sync';

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
 * Collect all quiz-related data from localStorage
 */
export function collectLocalData(): SyncData {
  const data: SyncData = {
    quizProgress: {},
    answeredQuestions: {},
    leitnerProgress: {},
    settings: {},
  };

  if (typeof window === 'undefined') return data;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Skip our own sync metadata
    if (key === SYNC_CODE_KEY || key === LAST_SYNC_KEY) continue;

    try {
      const value = localStorage.getItem(key);
      if (!value) continue;

      if (key.startsWith('quiz_progress_') || key.startsWith('quiz-')) {
        data.quizProgress[key] = JSON.parse(value);
      } else if (key === 'quiz_answered_global') {
        data.answeredQuestions = JSON.parse(value);
      } else if (key.startsWith('leitner')) {
        data.leitnerProgress[key] = JSON.parse(value);
      } else if (key === 'theme') {
        data.settings[key] = value; // theme is a plain string, not JSON
      }
    } catch {
      // Skip unparseable values
    }
  }

  return data;
}

/**
 * Write synced data into localStorage
 */
function applyData(data: SyncData): void {
  if (typeof window === 'undefined') return;

  // Quiz progress
  if (data.quizProgress) {
    for (const [key, value] of Object.entries(data.quizProgress)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  // Answered questions
  if (
    data.answeredQuestions &&
    Object.keys(data.answeredQuestions).length > 0
  ) {
    localStorage.setItem(
      'quiz_answered_global',
      JSON.stringify(data.answeredQuestions)
    );
  }

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
}

/**
 * Merge two sets of sync data
 * Strategy:
 * - Quiz Progress: Local wins (active session)
 * - Answered Questions: Union of arrays (keep all answered)
 * - Leitner: Union of arrays per box (keep all progress)
 * - Settings: Remote wins (consistency), unless empty
 */
function mergeData(local: SyncData, remote: SyncData): SyncData {
  const merged: SyncData = {
    quizProgress: { ...remote.quizProgress, ...local.quizProgress }, // Local overrides active session
    answeredQuestions: { ...local.answeredQuestions },
    leitnerProgress: { ...local.leitnerProgress },
    settings: { ...local.settings, ...remote.settings }, // Remote settings propagate (unless local has specific overrides? keeping simple)
    lastSync: new Date().toISOString(),
  };

  // Merge Answered Questions (Union)
  // Assuming structure is { topicId: [qId1, qId2] }
  for (const key in remote.answeredQuestions) {
    const localVal = local.answeredQuestions[key];
    const remoteVal = remote.answeredQuestions[key];

    if (Array.isArray(localVal) && Array.isArray(remoteVal)) {
      merged.answeredQuestions[key] = Array.from(
        new Set([...localVal, ...remoteVal])
      );
    } else if (!localVal) {
      merged.answeredQuestions[key] = remoteVal;
    }
  }

  // Merge Leitner Progress (Union per box)
  // Structure: { "leitner-progress": { box1: [], box2: [], ... } }
  for (const key in remote.leitnerProgress) {
    const localObj = local.leitnerProgress[key] as Record<string, unknown>;
    const remoteObj = remote.leitnerProgress[key] as Record<string, unknown>;

    if (localObj && remoteObj) {
      const mergedBoxes: Record<string, unknown> = { ...localObj };
      for (const boxKey in remoteObj) {
        const localBox = localObj[boxKey];
        const remoteBox = remoteObj[boxKey];
        if (Array.isArray(localBox) && Array.isArray(remoteBox)) {
          mergedBoxes[boxKey] = Array.from(
            new Set([...localBox, ...remoteBox])
          );
        } else if (!localBox) {
          mergedBoxes[boxKey] = remoteBox;
        }
      }
      merged.leitnerProgress[key] = mergedBoxes;
    } else if (!localObj) {
      merged.leitnerProgress[key] = remoteObj;
    }
  }

  return merged;
}

/**
 * Fetch remote data (internal helper)
 */
async function fetchRemoteData(syncCode: string): Promise<SyncResponse> {
  const response = await fetch(`/api/sync?code=${syncCode}`);
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  return await response.json();
}

/**
 * Full Sync: Pull -> Merge -> Push
 * This is the safe way to sync without overwriting data.
 */
export async function sync(syncCode: string): Promise<SyncResponse> {
  try {
    // 1. Pull remote data
    const pullResult = await fetchRemoteData(syncCode);
    if (!pullResult.success) {
      throw new Error(pullResult.error || 'Pull failed');
    }

    const remoteData = pullResult.data;
    const localData = collectLocalData();

    // 2. Merge
    const mergedData = remoteData
      ? mergeData(localData, remoteData)
      : localData;

    // 3. Apply merged data locally
    applyData(mergedData);

    // 4. Push merged data back to server
    // Passing mergedData explicitly to avoid re-reading storage
    const pushResult = await pushData(syncCode, mergedData);

    return {
      success: true,
      message: 'Synced successfully',
      data: mergedData,
      lastSync: pushResult.lastSync,
    };
  } catch (e: unknown) {
    console.error('Sync error:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Sync failed',
    };
  }
}

/**
 * Push local data to the cloud under a sync code
 * @param syncCode The code to push to
 * @param data Optional data to push (defaults to collecting local data)
 */
export async function pushData(
  syncCode: string,
  data?: SyncData
): Promise<SyncResponse> {
  const payload = data || collectLocalData();

  const response = await fetch(`/api/sync?code=${syncCode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
 * Restore data from cloud (Overwrite local)
 * Used for "Restore" button
 */
export async function pullData(syncCode: string): Promise<SyncResponse> {
  try {
    const result = await fetchRemoteData(syncCode);

    if (result.success && result.data) {
      applyData(result.data);
      storeSyncCode(syncCode);
      if (result.lastSync) {
        localStorage.setItem(LAST_SYNC_KEY, result.lastSync);
      }
    }
    return result;
  } catch (e: unknown) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error',
    };
  }
}
