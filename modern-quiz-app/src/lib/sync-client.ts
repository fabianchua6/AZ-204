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
    // Quiz progress
    if (data.quizProgress) {
        for (const [key, value] of Object.entries(data.quizProgress)) {
            localStorage.setItem(key, JSON.stringify(value));
        }
    }

    // Answered questions
    if (data.answeredQuestions && Object.keys(data.answeredQuestions).length > 0) {
        localStorage.setItem('quiz_answered_global', JSON.stringify(data.answeredQuestions));
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
        throw new Error(`Pull failed: ${response.statusText}`);
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
