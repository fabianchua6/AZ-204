import {
  collectLocalData,
  getStoredSyncCode,
  storeSyncCode,
  pushData,
  pullData,
  sync,
} from '../sync-client';

// Mock localStorage
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
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  jest.clearAllMocks();
});

describe('storeSyncCode / getStoredSyncCode', () => {
  it('stores and retrieves a sync code', () => {
    storeSyncCode('AZ-ABC123');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_sync_code',
      'AZ-ABC123'
    );
    expect(getStoredSyncCode()).toBe('AZ-ABC123');
  });

  it('uppercases the code on store', () => {
    storeSyncCode('az-abc123');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_sync_code',
      'AZ-ABC123'
    );
  });

  it('returns null when no code stored', () => {
    expect(getStoredSyncCode()).toBeNull();
  });
});

describe('collectLocalData', () => {
  it('collects leitner keys into leitnerProgress', () => {
    localStorageMock.setItem(
      'leitner-progress',
      JSON.stringify({ q1: { currentBox: 2 } })
    );
    const data = collectLocalData();
    expect(data.leitnerProgress).toHaveProperty('leitner-progress');
  });

  it('does NOT collect dead quiz_progress_* keys', () => {
    localStorageMock.setItem(
      'quiz_progress_topic1',
      JSON.stringify({ index: 5 })
    );
    const data = collectLocalData();
    expect(data.quizProgress).toEqual({});
  });

  it('does NOT collect quiz_answered_global', () => {
    localStorageMock.setItem(
      'quiz_answered_global',
      JSON.stringify({ topic1: ['q1'] })
    );
    const data = collectLocalData();
    expect(data.answeredQuestions).toEqual({});
  });

  it('collects theme as a plain string setting', () => {
    localStorageMock.setItem('theme', 'dark');
    const data = collectLocalData();
    expect(data.settings['theme']).toBe('dark');
  });

  it('collects activity keys (study-streak, daily-brief-last-shown)', () => {
    localStorageMock.setItem(
      'study-streak',
      JSON.stringify({
        currentStreak: 3,
        bestStreak: 5,
        lastStudyDate: '2025-01-15',
      })
    );
    localStorageMock.setItem(
      'daily-brief-last-shown',
      JSON.stringify('2025-01-15')
    );
    const data = collectLocalData();
    expect(data.activity).toHaveProperty('study-streak');
    expect(data.activity).toHaveProperty('daily-brief-last-shown');
  });
});

describe('pushData', () => {
  it('sends data to the correct endpoint with query param', async () => {
    localStorageMock.setItem(
      'leitner-progress',
      JSON.stringify({ box1: ['q1'] })
    );

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, lastSync: '2025-01-01T00:00:00Z' }),
    });

    await pushData('AZ-ABC123');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/sync/AZ-ABC123',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('pullData (Restore)', () => {
  it('fetches data with query param', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });

    await pullData('AZ-ABC123');

    expect(global.fetch).toHaveBeenCalledWith('/api/sync/AZ-ABC123');
  });
});

describe('sync (Smart Merge)', () => {
  it('merges local and remote leitner data correctly', async () => {
    // Setup Local Data: has leitner-progress with q1
    localStorageMock.setItem(
      'leitner-progress',
      JSON.stringify({ q1: { currentBox: 2 } })
    );

    // Setup Remote Data: has extra leitner key that local doesn't have
    const remoteData = {
      quizProgress: {},
      answeredQuestions: {},
      leitnerProgress: {
        'leitner-progress': { q2: { currentBox: 1 } },
        'leitner-daily-attempts-2025-01-01': 10,
      },
      settings: {},
      activity: {},
      lastSync: '2025-01-01T00:00:00Z',
    };

    // Mock Fetch for Pull (return remote data)
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: remoteData }),
      })
      // Mock Fetch for Push (success)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, lastSync: '2025-01-02T00:00:00Z' }),
      });

    const result = await sync('AZ-MERGE');

    expect(result.success).toBe(true);

    // Verify Pull was called
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/sync/AZ-MERGE');

    // Local leitner-progress wins (already exists locally)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'leitner-progress',
      expect.stringContaining('q1')
    );

    // Remote-only key (leitner-daily-attempts) gets merged in
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'leitner-daily-attempts-2025-01-01',
      expect.any(String)
    );

    // Verify Push was called with Merged Data
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/sync/AZ-MERGE',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('q1'),
      })
    );
  });

  it('merges study-streak with higher wins strategy', async () => {
    // Local: streak of 3
    localStorageMock.setItem(
      'study-streak',
      JSON.stringify({
        currentStreak: 3,
        bestStreak: 5,
        lastStudyDate: '2025-01-15',
      })
    );

    // Remote: streak of 7 with better best
    const remoteData = {
      quizProgress: {},
      answeredQuestions: {},
      leitnerProgress: {},
      settings: {},
      activity: {
        'study-streak': {
          currentStreak: 7,
          bestStreak: 10,
          lastStudyDate: '2025-01-14',
        },
      },
      lastSync: '2025-01-14T00:00:00Z',
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: remoteData }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, lastSync: '2025-01-15T00:00:00Z' }),
      });

    await sync('AZ-STREAK');

    // Find the LAST study-streak setItem call (after merge, not the seed)
    const streakCalls = (
      localStorageMock.setItem as jest.Mock
    ).mock.calls.filter((c: string[]) => c[0] === 'study-streak');
    expect(streakCalls.length).toBeGreaterThanOrEqual(1);
    const merged = JSON.parse(streakCalls[streakCalls.length - 1]![1]);
    expect(merged.currentStreak).toBe(3); // local preserved via spread (currentStreak is recomputed at read time)
    expect(merged.bestStreak).toBe(10); // higher wins
    expect(merged.lastStudyDate).toBe('2025-01-15'); // more recent wins
  });

  it('handles sync when no remote data exists', async () => {
    localStorageMock.setItem(
      'leitner-progress',
      JSON.stringify({ q1: { currentBox: 2 } })
    );

    // Remote returns null data
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, lastSync: '2025-01-01T00:00:00Z' }),
      });

    await sync('AZ-NEW');

    // Should just push local data
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/sync/AZ-NEW',
      expect.objectContaining({
        body: expect.stringContaining('q1'),
      })
    );
  });
});
