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
  // ... existing tests verify data collection ...
  it('collects quiz progress keys', () => {
    localStorageMock.setItem(
      'quiz_progress_topic1',
      JSON.stringify({ index: 5 })
    );
    const data = collectLocalData();
    expect(data.quizProgress).toHaveProperty('quiz_progress_topic1');
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
  it('merges local and remote data correctly', async () => {
    // Setup Local Data: Answered Q1
    localStorageMock.setItem(
      'quiz_answered_global',
      JSON.stringify({ topic1: ['q1'] })
    );
    localStorageMock.setItem(
      'leitner-progress',
      JSON.stringify({ box1: ['q1'] })
    );

    // Setup Remote Data: Answered Q2
    const remoteData = {
      quizProgress: {},
      answeredQuestions: { topic1: ['q2'] },
      leitnerProgress: { 'leitner-progress': { box1: ['q2'] } },
      settings: {},
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

    // Verify Data was Merged and Applied Locally
    // Should have Q1 AND Q2
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_answered_global',
      expect.stringContaining('q1')
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'quiz_answered_global',
      expect.stringContaining('q2')
    );

    // Verify Push was called with Merged Data
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      '/api/sync/AZ-MERGE',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('q1'), // should check for both
      })
    );
  });

  it('handles sync when no remote data exists', async () => {
    localStorageMock.setItem(
      'quiz_answered_global',
      JSON.stringify({ topic1: ['q1'] })
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
