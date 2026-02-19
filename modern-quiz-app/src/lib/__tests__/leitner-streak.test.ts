import { LeitnerSystem } from '../leitner';
import { AlgorithmUtils } from '../leitner/utils';
import type { Question } from '@/types/quiz';

describe('Leitner streak calculation', () => {
  const mockQuestions: Question[] = [
    {
      id: 'q1',
      question: 'Q1',
      options: ['A'],
      answerIndexes: [0],
      topic: 'T1',
      hasCode: false,
      answer: 'A',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-02-19T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('calculates streak from daily history starting from yesterday when today has no activity', () => {
    const history = {
      '2026-02-18': 8,
      '2026-02-17': 4,
      '2026-02-16': 2,
    };

    const streak = AlgorithmUtils.calculateStreakDaysFromDailyHistory(history);
    expect(streak).toBe(3);
  });

  it('breaks streak at first missing day in daily history', () => {
    const history = {
      '2026-02-18': 5,
      '2026-02-16': 5,
    };

    const streak = AlgorithmUtils.calculateStreakDaysFromDailyHistory(history);
    expect(streak).toBe(1);
  });

  it('getStats uses daily history as primary source for streakDays', async () => {
    const system = new LeitnerSystem();
    await system.ensureInitialized();
    system.clearProgress();

    localStorage.setItem('leitner-daily-attempts-2026-02-18', '7');
    localStorage.setItem('leitner-daily-attempts-2026-02-17', '3');
    localStorage.setItem('leitner-daily-attempts-2026-02-16', '1');

    const stats = system.getStats(mockQuestions);
    expect(stats.streakDays).toBe(3);
  });
});
