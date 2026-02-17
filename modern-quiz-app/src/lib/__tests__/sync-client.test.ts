import {
    collectLocalData,
    getStoredSyncCode,
    storeSyncCode,
    getLastSyncTime,
    pushData,
    pullData,
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
        expect(localStorageMock.setItem).toHaveBeenCalledWith('quiz_sync_code', 'AZ-ABC123');
        expect(getStoredSyncCode()).toBe('AZ-ABC123');
    });

    it('uppercases the code on store', () => {
        storeSyncCode('az-abc123');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('quiz_sync_code', 'AZ-ABC123');
    });

    it('returns null when no code stored', () => {
        expect(getStoredSyncCode()).toBeNull();
    });
});

describe('getLastSyncTime', () => {
    it('returns null when no sync time stored', () => {
        expect(getLastSyncTime()).toBeNull();
    });

    it('returns the stored sync time', () => {
        localStorageMock.setItem('quiz_last_sync', '2025-01-01T00:00:00Z');
        expect(getLastSyncTime()).toBe('2025-01-01T00:00:00Z');
    });
});

describe('collectLocalData', () => {
    it('collects quiz progress keys', () => {
        localStorageMock.setItem('quiz_progress_topic1', JSON.stringify({ index: 5 }));
        localStorageMock.setItem('quiz-practice-state', JSON.stringify({ active: true }));

        const data = collectLocalData();
        expect(data.quizProgress).toHaveProperty('quiz_progress_topic1');
        expect(data.quizProgress).toHaveProperty('quiz-practice-state');
    });

    it('collects answered questions', () => {
        const answered = { topic1: ['q1', 'q2'] };
        localStorageMock.setItem('quiz_answered_global', JSON.stringify(answered));

        const data = collectLocalData();
        expect(data.answeredQuestions).toEqual(answered);
    });

    it('collects leitner progress', () => {
        localStorageMock.setItem('leitner-progress', JSON.stringify({ box1: ['q1'] }));

        const data = collectLocalData();
        expect(data.leitnerProgress).toHaveProperty('leitner-progress');
    });

    it('collects theme setting as plain string', () => {
        localStorageMock.setItem('theme', 'dark');

        const data = collectLocalData();
        expect(data.settings).toHaveProperty('theme', 'dark');
    });

    it('skips sync metadata keys', () => {
        localStorageMock.setItem('quiz_sync_code', 'AZ-ABC123');
        localStorageMock.setItem('quiz_last_sync', '2025-01-01T00:00:00Z');

        const data = collectLocalData();
        // These should NOT appear in any category
        const allKeys = [
            ...Object.keys(data.quizProgress),
            ...Object.keys(data.answeredQuestions),
            ...Object.keys(data.leitnerProgress),
            ...Object.keys(data.settings),
        ];
        expect(allKeys).not.toContain('quiz_sync_code');
        expect(allKeys).not.toContain('quiz_last_sync');
    });
});

describe('pushData', () => {
    it('sends data to the correct endpoint', async () => {
        localStorageMock.setItem('leitner-progress', JSON.stringify({ box1: ['q1'] }));

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, lastSync: '2025-01-01T00:00:00Z' }),
        });

        await pushData('AZ-ABC123');

        expect(global.fetch).toHaveBeenCalledWith(
            '/api/sync/AZ-ABC123',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
        );
    });

    it('stores sync code and last sync time on success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, lastSync: '2025-01-01T00:00:00Z' }),
        });

        await pushData('AZ-XYZ789');

        expect(localStorageMock.setItem).toHaveBeenCalledWith('quiz_sync_code', 'AZ-XYZ789');
        expect(localStorageMock.setItem).toHaveBeenCalledWith('quiz_last_sync', '2025-01-01T00:00:00Z');
    });

    it('throws on failed response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            statusText: 'Internal Server Error',
        });

        await expect(pushData('AZ-ABC123')).rejects.toThrow('Push failed');
    });
});

describe('pullData', () => {
    it('fetches data from the correct endpoint', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: null, lastSync: null }),
        });

        await pullData('AZ-ABC123');

        expect(global.fetch).toHaveBeenCalledWith('/api/sync/AZ-ABC123');
    });

    it('applies data to localStorage on success', async () => {
        const mockData = {
            quizProgress: { 'quiz_progress_topic1': { index: 5 } },
            answeredQuestions: { topic1: ['q1', 'q2'] },
            leitnerProgress: { 'leitner-progress': { box1: ['q1'] } },
            settings: { theme: 'dark' },
            lastSync: '2025-01-01T00:00:00Z',
        };

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: mockData, lastSync: mockData.lastSync }),
        });

        await pullData('AZ-ABC123');

        // Check data was written to localStorage
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'quiz_progress_topic1',
            JSON.stringify({ index: 5 })
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'quiz_answered_global',
            JSON.stringify({ topic1: ['q1', 'q2'] })
        );
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'leitner-progress',
            JSON.stringify({ box1: ['q1'] })
        );
        // Theme is stored as plain string
        expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('does not apply data when result has no data', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, data: null, lastSync: null }),
        });

        const result = await pullData('AZ-ABC123');
        expect(result.data).toBeNull();
    });

    it('throws on failed response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            statusText: 'Not Found',
        });

        await expect(pullData('AZ-ABC123')).rejects.toThrow('Pull failed');
    });
});
