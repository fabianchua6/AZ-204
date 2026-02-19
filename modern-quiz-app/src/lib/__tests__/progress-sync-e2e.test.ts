/**
 * End-to-end style tests for progress saving, restoration, and sync round-trips.
 *
 * These tests simulate realistic user flows:
 *   1. User answers questions → progress saved to localStorage
 *   2. User pushes progress to cloud → data collected & sent to API
 *   3. User pulls on new device → data applied to localStorage
 *   4. Leitner progress survives round-trip
 *   5. Edge cases: empty data, large payloads, partial data, corrupt data
 */

import {
  collectLocalData,
  pushData,
  pullData,
  storeSyncCode,
  getStoredSyncCode,
  getLastSyncTime,
} from '../sync-client';
import {
  generateSyncCode,
  isValidSyncCode,
  SYNC_TTL_SECONDS,
  type SyncData,
} from '../generate-sync-code';

// ── localStorage mock ──────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
    // Helper: raw access for assertions (not part of Storage API)
    _dump: () => ({ ...store }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

// ── Helpers ────────────────────────────────────────────────────────
/** Seed localStorage with a realistic set of quiz data */
function seedRealisticProgress() {
  // Quiz progress for two topics
  localStorageMock.setItem(
    'quiz_progress_azure-functions',
    JSON.stringify({
      index: 12,
      questionOrder: ['q1', 'q2', 'q3'],
      timestamp: Date.now(),
    })
  );
  localStorageMock.setItem(
    'quiz_progress_blob-storage',
    JSON.stringify({
      index: 5,
      questionOrder: ['q10', 'q11'],
      timestamp: Date.now(),
    })
  );

  // Practice mode state
  localStorageMock.setItem(
    'quiz-practice-state',
    JSON.stringify({ active: true, topic: 'azure-functions', questionIndex: 3 })
  );

  // Answered questions
  localStorageMock.setItem(
    'quiz_answered_global',
    JSON.stringify({
      'azure-functions': ['q1', 'q2', 'q3'],
      'blob-storage': ['q10'],
      _all: ['q1', 'q2', 'q3', 'q10'],
    })
  );

  // Leitner progress
  const leitnerData: Record<string, unknown> = {
    q1: {
      questionId: 'q1',
      currentBox: 2,
      nextReviewDate: '2026-02-20T00:00:00.000Z',
      timesCorrect: 3,
      timesIncorrect: 1,
      lastReviewed: '2026-02-18T10:00:00.000Z',
      lastAnswerCorrect: true,
    },
    q2: {
      questionId: 'q2',
      currentBox: 1,
      nextReviewDate: '2026-02-19T00:00:00.000Z',
      timesCorrect: 0,
      timesIncorrect: 2,
      lastReviewed: '2026-02-18T10:05:00.000Z',
      lastAnswerCorrect: false,
    },
    q3: {
      questionId: 'q3',
      currentBox: 3,
      nextReviewDate: '2026-02-21T00:00:00.000Z',
      timesCorrect: 5,
      timesIncorrect: 0,
      lastReviewed: '2026-02-18T10:10:00.000Z',
      lastAnswerCorrect: true,
    },
  };
  localStorageMock.setItem('leitner-progress', JSON.stringify(leitnerData));
  localStorageMock.setItem('leitner-daily-target', JSON.stringify(20));
  localStorageMock.setItem('leitner-daily-attempts-2026-02-18', '15');

  // Theme setting (plain string, not JSON)
  localStorageMock.setItem('theme', 'dark');
}

/** Create a mock fetch that simulates a successful push + pull round-trip */
function mockFetchRoundTrip() {
  let stored: SyncData | null = null;
  const lastSync = '2026-02-18T12:00:00.000Z';

  (global.fetch as jest.Mock).mockImplementation(
    async (url: string, init?: RequestInit) => {
      if (init?.method === 'POST') {
        stored = JSON.parse(init.body as string);
        if (stored) {
          (stored as SyncData).lastSync = lastSync;
        }
        return {
          ok: true,
          json: async () => ({
            success: true,
            lastSync,
            message: 'Data synced successfully',
          }),
        };
      }
      // GET
      return {
        ok: true,
        json: async () => ({
          success: true,
          data: stored,
          lastSync: stored ? lastSync : null,
        }),
      };
    }
  );

  return { getStored: () => stored, lastSync };
}

// ═══════════════════════════════════════════════════════════════════
// 1. Progress Collection (localStorage → SyncData)
// ═══════════════════════════════════════════════════════════════════
describe('Progress Collection', () => {
  it('collects all quiz progress keys into quizProgress', () => {
    seedRealisticProgress();
    const data = collectLocalData();

    expect(data.quizProgress).toHaveProperty('quiz_progress_azure-functions');
    expect(data.quizProgress).toHaveProperty('quiz_progress_blob-storage');
    expect(data.quizProgress).toHaveProperty('quiz-practice-state');
    expect(
      (data.quizProgress['quiz_progress_azure-functions'] as { index: number })
        .index
    ).toBe(12);
  });

  it('collects answered questions with all topic keys', () => {
    seedRealisticProgress();
    const data = collectLocalData();

    expect(data.answeredQuestions).toHaveProperty('azure-functions');
    expect(data.answeredQuestions).toHaveProperty('blob-storage');
    expect(data.answeredQuestions).toHaveProperty('_all');
    expect(
      (data.answeredQuestions as Record<string, string[]>)['azure-functions']
    ).toEqual(['q1', 'q2', 'q3']);
  });

  it('collects all leitner-prefixed keys', () => {
    seedRealisticProgress();
    const data = collectLocalData();

    expect(data.leitnerProgress).toHaveProperty('leitner-progress');
    expect(data.leitnerProgress).toHaveProperty('leitner-daily-target');
    expect(data.leitnerProgress).toHaveProperty(
      'leitner-daily-attempts-2026-02-18'
    );
  });

  it('preserves full Leitner box assignments per question', () => {
    seedRealisticProgress();
    const data = collectLocalData();

    const lp = data.leitnerProgress['leitner-progress'] as Record<
      string,
      { currentBox: number }
    >;
    expect(lp['q1'].currentBox).toBe(2);
    expect(lp['q2'].currentBox).toBe(1);
    expect(lp['q3'].currentBox).toBe(3);
  });

  it('collects theme as a plain string (not JSON-wrapped)', () => {
    seedRealisticProgress();
    const data = collectLocalData();

    // theme should be the raw string 'dark', not '"dark"'
    expect(data.settings['theme']).toBe('dark');
  });

  it('never includes sync metadata in collected data', () => {
    seedRealisticProgress();
    localStorageMock.setItem('quiz_sync_code', 'AZ-ABC123');
    localStorageMock.setItem('quiz_last_sync', '2026-02-18T00:00:00.000Z');

    const data = collectLocalData();
    const allKeys = [
      ...Object.keys(data.quizProgress),
      ...Object.keys(data.answeredQuestions),
      ...Object.keys(data.leitnerProgress),
      ...Object.keys(data.settings),
    ];
    expect(allKeys).not.toContain('quiz_sync_code');
    expect(allKeys).not.toContain('quiz_last_sync');
  });

  it('returns empty categories when localStorage is empty', () => {
    const data = collectLocalData();

    expect(data.quizProgress).toEqual({});
    expect(data.answeredQuestions).toEqual({});
    expect(data.leitnerProgress).toEqual({});
    expect(data.settings).toEqual({});
  });

  it('skips malformed JSON values gracefully', () => {
    localStorageMock.setItem('quiz_progress_bad', '{not valid json}');
    localStorageMock.setItem(
      'quiz_progress_good',
      JSON.stringify({ index: 1 })
    );

    const data = collectLocalData();

    // The bad one should be skipped, the good one collected
    expect(data.quizProgress).not.toHaveProperty('quiz_progress_bad');
    expect(data.quizProgress).toHaveProperty('quiz_progress_good');
  });
});

// ═══════════════════════════════════════════════════════════════════
// 2. Full Sync Round-Trip (push → pull on fresh device)
// ═══════════════════════════════════════════════════════════════════
describe('Sync Round-Trip', () => {
  it('push → pull restores all quiz progress to a blank localStorage', async () => {
    // Device A: seed data and push
    seedRealisticProgress();
    const { lastSync } = mockFetchRoundTrip();
    const syncCode = generateSyncCode();

    await pushData(syncCode);

    // Verify push sent all categories
    const pushCall = (global.fetch as jest.Mock).mock.calls[0];
    const sentBody = JSON.parse(pushCall[1].body);
    expect(Object.keys(sentBody.quizProgress).length).toBeGreaterThanOrEqual(3);
    expect(sentBody.answeredQuestions).toHaveProperty('_all');
    expect(sentBody.leitnerProgress).toHaveProperty('leitner-progress');
    expect(sentBody.settings).toHaveProperty('theme', 'dark');

    // Device B: clear localStorage and pull
    localStorageMock.clear();
    jest.clearAllMocks();

    // Re-setup the mock for the GET request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          ...sentBody,
          lastSync,
        },
        lastSync,
      }),
    });

    await pullData(syncCode);

    // Verify data was restored
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_progress_azure-functions',
      expect.any(String)
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_answered_global',
      expect.any(String)
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'leitner-progress',
      expect.any(String)
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });

  it('Leitner box assignments survive a round-trip', async () => {
    seedRealisticProgress();
    const { lastSync } = mockFetchRoundTrip();
    const syncCode = generateSyncCode();

    await pushData(syncCode);

    // Capture what was sent
    const sentBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    );

    // Clear and pull
    localStorageMock.clear();
    jest.clearAllMocks();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...sentBody, lastSync },
        lastSync,
      }),
    });

    await pullData(syncCode);

    // Find the setItem call for leitner-progress
    const leitnerCall = (localStorageMock.setItem as jest.Mock).mock.calls.find(
      (c: string[]) => c[0] === 'leitner-progress'
    );
    expect(leitnerCall).toBeDefined();

    const restored = JSON.parse(leitnerCall![1]);
    expect(restored['q1'].currentBox).toBe(2);
    expect(restored['q2'].currentBox).toBe(1);
    expect(restored['q3'].currentBox).toBe(3);
    expect(restored['q1'].timesCorrect).toBe(3);
    expect(restored['q2'].timesIncorrect).toBe(2);
  });

  it('preserves answered question lists across devices', async () => {
    seedRealisticProgress();
    const { lastSync } = mockFetchRoundTrip();
    const syncCode = generateSyncCode();

    await pushData(syncCode);
    const sentBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    );

    localStorageMock.clear();
    jest.clearAllMocks();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: { ...sentBody, lastSync },
        lastSync,
      }),
    });

    await pullData(syncCode);

    const answeredCall = (
      localStorageMock.setItem as jest.Mock
    ).mock.calls.find((c: string[]) => c[0] === 'quiz_answered_global');
    expect(answeredCall).toBeDefined();
    const restored = JSON.parse(answeredCall![1]);
    expect(restored['azure-functions']).toEqual(['q1', 'q2', 'q3']);
    expect(restored['blob-storage']).toEqual(['q10']);
    expect(restored['_all']).toEqual(['q1', 'q2', 'q3', 'q10']);
  });

  it('stores sync code and last sync time after push', async () => {
    mockFetchRoundTrip();
    const syncCode = generateSyncCode();

    await pushData(syncCode);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_sync_code',
      syncCode
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_last_sync',
      '2026-02-18T12:00:00.000Z'
    );
  });

  it('stores sync code and last sync time after pull', async () => {
    const syncCode = generateSyncCode();
    const lastSync = '2026-02-18T12:00:00.000Z';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          quizProgress: {},
          answeredQuestions: {},
          leitnerProgress: {},
          settings: {},
          lastSync,
        },
        lastSync,
      }),
    });

    await pullData(syncCode);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_sync_code',
      syncCode
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_last_sync',
      lastSync
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// 3. Edge Cases & Error Handling
// ═══════════════════════════════════════════════════════════════════
describe('Edge Cases', () => {
  it('push works with completely empty localStorage', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lastSync: '2026-02-18T12:00:00.000Z',
      }),
    });

    const syncCode = generateSyncCode();
    const result = await pushData(syncCode);

    expect(result.success).toBe(true);
    const sentBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    );
    expect(sentBody.quizProgress).toEqual({});
    expect(sentBody.answeredQuestions).toEqual({});
  });

  it('pull with null data does not overwrite existing localStorage', async () => {
    // Pre-populate localStorage
    localStorageMock.setItem(
      'quiz_progress_topic1',
      JSON.stringify({ index: 5 })
    );

    // Clear mock call history so we only see calls from pullData
    (localStorageMock.setItem as jest.Mock).mockClear();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null, lastSync: null }),
    });

    const syncCode = generateSyncCode();
    await pullData(syncCode);

    // pullData with null data should not write any quiz progress keys
    const setItemCalls = (localStorageMock.setItem as jest.Mock).mock.calls;
    const progressOverwrite = setItemCalls.find(
      (c: string[]) => c[0] === 'quiz_progress_topic1'
    );
    expect(progressOverwrite).toBeUndefined();
  });

  it('push throws on network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const syncCode = generateSyncCode();
    await expect(pushData(syncCode)).rejects.toThrow('Network error');
  });

  it('pull returns error on 500 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error',
    });

    const syncCode = generateSyncCode();
    const result = await pullData(syncCode);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('push throws on 503 (Redis unavailable)', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Service Unavailable',
    });

    const syncCode = generateSyncCode();
    await expect(pushData(syncCode)).rejects.toThrow('Push failed');
  });

  it('handles large payloads (many topics, many questions)', async () => {
    // Seed a large amount of data
    for (let i = 0; i < 50; i++) {
      localStorageMock.setItem(
        `quiz_progress_topic-${i}`,
        JSON.stringify({
          index: i,
          questionOrder: Array.from({ length: 100 }, (_, j) => `q${j}`),
        })
      );
    }

    const answered: Record<string, string[]> = {};
    for (let i = 0; i < 50; i++) {
      answered[`topic-${i}`] = Array.from({ length: 100 }, (_, j) => `q${j}`);
    }
    localStorageMock.setItem('quiz_answered_global', JSON.stringify(answered));

    const leitner: Record<string, unknown> = {};
    for (let i = 0; i < 500; i++) {
      leitner[`q${i}`] = {
        questionId: `q${i}`,
        currentBox: (i % 3) + 1,
        nextReviewDate: '2026-02-20T00:00:00.000Z',
        timesCorrect: i,
        timesIncorrect: 0,
        lastReviewed: '2026-02-18T00:00:00.000Z',
        lastAnswerCorrect: true,
      };
    }
    localStorageMock.setItem('leitner-progress', JSON.stringify(leitner));

    const data = collectLocalData();

    expect(Object.keys(data.quizProgress)).toHaveLength(50);
    expect(Object.keys(data.answeredQuestions)).toHaveLength(50);
    const lp = data.leitnerProgress['leitner-progress'] as Record<
      string,
      unknown
    >;
    expect(Object.keys(lp)).toHaveLength(500);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 4. Sync Code Management
// ═══════════════════════════════════════════════════════════════════
describe('Sync Code Lifecycle', () => {
  it('generated codes always pass validation', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateSyncCode();
      expect(isValidSyncCode(code)).toBe(true);
    }
  });

  it('storeSyncCode → getStoredSyncCode round-trip', () => {
    const code = generateSyncCode();
    storeSyncCode(code);
    expect(getStoredSyncCode()).toBe(code);
  });

  it('sync code persists across push and is retrievable', async () => {
    mockFetchRoundTrip();
    const code = generateSyncCode();
    await pushData(code);

    expect(getStoredSyncCode()).toBe(code);
  });

  it('last sync time is updated after successful push', async () => {
    mockFetchRoundTrip();
    const code = generateSyncCode();

    expect(getLastSyncTime()).toBeNull();
    await pushData(code);
    expect(getLastSyncTime()).toBe('2026-02-18T12:00:00.000Z');
  });

  it('SYNC_TTL_SECONDS is exactly 90 days', () => {
    expect(SYNC_TTL_SECONDS).toBe(90 * 24 * 60 * 60);
    expect(SYNC_TTL_SECONDS).toBe(7776000);
  });
});

// ═══════════════════════════════════════════════════════════════════
// 5. Data Integrity: what goes up must come down unchanged
// ═══════════════════════════════════════════════════════════════════
describe('Data Integrity', () => {
  it('SyncData shape matches what the API route expects', () => {
    seedRealisticProgress();
    const data = collectLocalData();

    // Must have all four top-level keys
    expect(data).toHaveProperty('quizProgress');
    expect(data).toHaveProperty('answeredQuestions');
    expect(data).toHaveProperty('leitnerProgress');
    expect(data).toHaveProperty('settings');

    // All values must be serializable (no functions, no undefined)
    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);
    expect(parsed).toEqual(data);
  });

  it('Leitner review dates survive JSON serialization', () => {
    seedRealisticProgress();
    const data = collectLocalData();

    const json = JSON.stringify(data);
    const parsed = JSON.parse(json);

    const lp = parsed.leitnerProgress['leitner-progress'];
    expect(lp['q1'].nextReviewDate).toBe('2026-02-20T00:00:00.000Z');
    expect(lp['q2'].lastReviewed).toBe('2026-02-18T10:05:00.000Z');
  });

  it('daily target number survives as-is', () => {
    seedRealisticProgress();
    const data = collectLocalData();

    const target = data.leitnerProgress['leitner-daily-target'];
    expect(target).toBe(20);
  });

  it('daily attempts string survives round-trip', () => {
    localStorageMock.setItem('leitner-daily-attempts-2026-02-18', '15');
    const data = collectLocalData();

    // The value '15' is stored as a plain string in localStorage, but
    // collectLocalData JSON.parses it → 15 (number)
    expect(data.leitnerProgress['leitner-daily-attempts-2026-02-18']).toBe(15);
  });

  it('theme setting is collected as plain string, not double-encoded', () => {
    localStorageMock.setItem('theme', 'dark');
    const data = collectLocalData();

    expect(data.settings['theme']).toBe('dark');
    expect(typeof data.settings['theme']).toBe('string');
  });

  it('push sends body that JSON.parse can reconstruct', async () => {
    seedRealisticProgress();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lastSync: '2026-02-18T12:00:00.000Z',
      }),
    });

    const syncCode = generateSyncCode();
    await pushData(syncCode);

    const sentBody = (global.fetch as jest.Mock).mock.calls[0][1].body;
    // Must be valid JSON
    expect(() => JSON.parse(sentBody)).not.toThrow();

    const parsed = JSON.parse(sentBody);
    expect(parsed.quizProgress).toBeDefined();
    expect(parsed.leitnerProgress).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// 6. API Route Contract (unit-level)
// ═══════════════════════════════════════════════════════════════════
describe('API Contract', () => {
  it('pushData calls POST /api/sync/{code}', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lastSync: '2026-02-18T12:00:00.000Z',
      }),
    });

    const code = 'AZ-ABC234';
    await pushData(code);

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sync?code=AZ-ABC234',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('pullData calls GET /api/sync/{code}', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null, lastSync: null }),
    });

    const code = 'AZ-XYZ789';
    await pullData(code);

    expect(global.fetch).toHaveBeenCalledWith('/api/sync?code=AZ-XYZ789');
  });

  it('push sends Content-Type: application/json', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lastSync: '2026-02-18T12:00:00.000Z',
      }),
    });

    await pushData('AZ-ABC234');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });
});
