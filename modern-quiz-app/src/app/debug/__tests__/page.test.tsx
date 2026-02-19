import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DebugPage from '../page';
import { useQuizData } from '@/hooks/use-quiz-data';
import { useTheme } from 'next-themes';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@/hooks/use-quiz-data', () => ({
  useQuizData: jest.fn(),
}));

jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

jest.mock('@/lib/leitner', () => ({
  leitnerSystem: {
    ensureInitialized: jest.fn().mockResolvedValue(undefined),
    getStats: jest.fn().mockReturnValue({
      questionsStarted: 0,
      boxDistribution: { 1: 0, 2: 0, 3: 0 },
    }),
  },
}));

jest.mock('@/lib/question-service', () => ({
  questionService: {
    filterQuestions: jest.fn().mockReturnValue([]),
  },
}));

jest.mock('@/lib/sync-client', () => ({
  getStoredSyncCode: jest.fn(() => null),
  getLastSyncTime: jest.fn(() => null),
  pullData: jest.fn(),
  sync: jest.fn(),
}));

describe('DebugPage safety actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
    });
    (useQuizData as jest.Mock).mockReturnValue({
      questions: [],
      loading: true,
    });

    localStorage.clear();
    localStorage.setItem(
      'leitner-progress',
      JSON.stringify({ q1: { box: 1 } })
    );
    localStorage.setItem('theme', 'dark');
    localStorage.setItem('quiz_sync_code', 'AZ-ABC123');
    localStorage.setItem('quiz_last_sync', '2026-02-19T00:00:00Z');
    localStorage.setItem('temp-key', 'temp-value');
  });

  it('clear cache preserves progress and sync keys while removing temporary keys', () => {
    render(<DebugPage />);

    fireEvent.click(screen.getByText('Clear Cache'));

    expect(localStorage.getItem('leitner-progress')).toBeTruthy();
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(localStorage.getItem('quiz_sync_code')).toBe('AZ-ABC123');
    expect(localStorage.getItem('quiz_last_sync')).toBe('2026-02-19T00:00:00Z');
    expect(localStorage.getItem('temp-key')).toBeNull();
  });

  it('blocks full reset until confirmation text is exactly confirm', async () => {
    render(<DebugPage />);

    fireEvent.click(screen.getByText('Reset Everything'));

    const resetButton = screen.getByRole('button', { name: 'Reset' });
    fireEvent.click(resetButton);

    expect(localStorage.getItem('leitner-progress')).toBeTruthy();
    expect(localStorage.getItem('temp-key')).toBe('temp-value');

    fireEvent.change(screen.getByPlaceholderText('Type confirm here'), {
      target: { value: 'confirm' },
    });

    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(localStorage.getItem('leitner-progress')).toBeNull();
      expect(localStorage.getItem('temp-key')).toBeNull();
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(localStorage.getItem('quiz_sync_code')).toBe('AZ-ABC123');
      expect(localStorage.getItem('quiz_last_sync')).toBe(
        '2026-02-19T00:00:00Z'
      );
    });
  });
});
