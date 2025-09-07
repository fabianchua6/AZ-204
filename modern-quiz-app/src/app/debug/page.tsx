'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { leitnerSystem } from '@/lib/leitner';
import { useQuizData } from '@/hooks/use-quiz-data';
import { questionService } from '@/lib/question-service';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const boxes = [1, 2, 3]; // 3-box system only
  const { questions, loading } = useQuizData();

  // Set page title
  useEffect(() => {
    document.title = 'Debug Console - AZ-204 Developer Tools';
  }, []);

  const [timezoneDebug, setTimezoneDebug] = useState<{
    currentTime: string;
    localDate: string;
    utcDate: string;
    timezoneOffset: number;
    testDueComparison: boolean;
    streakTest: {
      currentStreak: number;
      todayHasActivity: boolean;
      sampleStoredDate: string;
      sampleConvertedDate: string;
    };
    edgeCaseTests: {
      midnightTransition: boolean;
      dstHandling: boolean;
      leapYearHandling: boolean;
    };
  } | null>(null);

  const [questionPoolDebug, setQuestionPoolDebug] = useState<{
    totalQuestions: number;
    filteredQuestions: number;
    progressStats: Record<string, number>;
    dueQuestions: number;
    sampleDueQuestions: Array<{
      id: string;
      topic: string;
      currentBox: number;
      isDue: boolean;
      nextReviewDate: string;
      timesCorrect: number;
      timesIncorrect: number;
    }>;
    topicDistribution: Record<string, number>;
  } | null>(null);

  // Add new state for navigation debug info
  const [navigationDebug, setNavigationDebug] = useState<{
    currentTopic: string | null;
    practiceState: {
      currentIndex: number;
      totalAnswered: number;
      showAnswer: boolean;
      lastUpdated: string;
    };
    leitnerState: {
      currentIndex: number;
      totalSubmissions: number;
      lastActivity: string;
      dueToday: number;
    };
    localStorage: {
      practiceKeys: Array<{
        key: string;
        size: string;
        value?: string;
        lastModified?: string;
      }>;
      leitnerKeys: Array<{
        key: string;
        size: string;
        value?: string;
        lastModified?: string;
      }>;
      otherKeys: Array<{ key: string; size: string }>;
    };
  } | null>(null);

  const [clearResult, setClearResult] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

  // Debug question pool
  const debugQuestionPool = async () => {
    if (loading || questions.length === 0) {
      setClearResult('❌ Questions not loaded yet. Please wait...');
      return;
    }

    try {
      const filteredQuestions = questionService.filterQuestions(questions);
      const debugData =
        await leitnerSystem.debugQuestionPool(filteredQuestions);
      setQuestionPoolDebug(debugData);
      setClearResult(
        `✅ Question pool analysis complete. Check console for detailed logs.`
      );
    } catch (error) {
      setClearResult(`❌ Error analyzing question pool: ${error}`);
      console.error('Question pool debug error:', error);
    }
  };

  // Prevent hydration mismatch by only running after client mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run after component is mounted on client
    if (!isMounted) return;

    // Debug timezone handling
    const debug = leitnerSystem.debugTimezone();
    setTimezoneDebug(debug);
  }, [isMounted]);

  // Clear quiz navigation states only (keeps Leitner progress)
  const clearQuizNavigationStates = () => {
    try {
      // Clear any quiz-related localStorage items that might be causing navigation issues
      const keysToRemove = [
        'practice-quiz-answers',
        'practice-quiz-index',
        'quiz-navigation-state',
        'quiz-current-question',
        'quiz-submission-states',
        'quiz-selected-answers',
        'quiz-card-states',
      ];

      let clearedCount = 0;
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });

      // Clear any dynamic quiz-related keys
      const keysToScan = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keysToScan.push(key);
      }

      keysToScan.forEach(key => {
        if (
          key.startsWith('submission-') ||
          key.startsWith('card-state-') ||
          key.startsWith('practice-')
        ) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });

      setClearResult(
        `✅ Cleared ${clearedCount} navigation state items. Your Leitner progress is preserved. Please refresh the page.`
      );
    } catch (error) {
      setClearResult(`❌ Error clearing navigation states: ${error}`);
    }
  };

  // New function to analyze current navigation state
  const analyzeNavigationState = async () => {
    try {
      await leitnerSystem.ensureInitialized();

      // Get current topic
      const currentTopic = localStorage.getItem('quiz-topic');

      // Analyze practice state
      const practiceAnswers = JSON.parse(
        localStorage.getItem('practice-quiz-answers') || '{}'
      );
      const practiceIndex = parseInt(
        localStorage.getItem('practice-quiz-index') || '0'
      );

      // Analyze leitner state
      const leitnerIndex = parseInt(
        localStorage.getItem('leitner-quiz-index') || '0'
      );
      const leitnerSubmissions = JSON.parse(
        localStorage.getItem('leitner-submission-states') || '{}'
      );

      // Get due questions count
      const filteredQuestions = questionService.filterQuestions(questions);
      const dueQuestions =
        await leitnerSystem.getDueQuestions(filteredQuestions);

      // Analyze localStorage keys
      const allKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          const size = new Blob([value]).size;
          allKeys.push({
            key,
            size: `${(size / 1024).toFixed(2)} KB`,
            value: value.length > 100 ? value.substring(0, 100) + '...' : value,
            lastModified: new Date().toISOString(),
          });
        }
      }

      const practiceKeys = allKeys.filter(
        item =>
          item.key.startsWith('practice-') ||
          (item.key.includes('quiz') && !item.key.includes('leitner'))
      );

      const leitnerKeys = allKeys.filter(
        item => item.key.includes('leitner') || item.key.startsWith('leitner-')
      );

      const otherKeys = allKeys.filter(
        item =>
          !practiceKeys.some(pk => pk.key === item.key) &&
          !leitnerKeys.some(lk => lk.key === item.key)
      );

      setNavigationDebug({
        currentTopic,
        practiceState: {
          currentIndex: practiceIndex,
          totalAnswered: Object.keys(practiceAnswers).length,
          showAnswer: false, // This would need to be read from component state
          lastUpdated: new Date().toISOString(),
        },
        leitnerState: {
          currentIndex: leitnerIndex,
          totalSubmissions: Object.keys(leitnerSubmissions).length,
          lastActivity: new Date().toISOString(),
          dueToday: dueQuestions.length,
        },
        localStorage: {
          practiceKeys,
          leitnerKeys,
          otherKeys,
        },
      });
    } catch (error) {
      setClearResult(`❌ Error analyzing navigation state: ${error}`);
    }
  }; // COMPREHENSIVE STATE CLEARING - This is what the user needs
  const clearAllQuizStates = () => {
    try {
      const keysToRemove = [
        // Practice mode keys
        'practice-quiz-answers',
        'practice-quiz-index',

        // Leitner mode keys
        'leitner-quiz-index',
        'leitner-submission-states',

        // Leitner system core data (THIS was missing!)
        'leitner-progress',
        'leitner-settings',

        // Topic selection
        'quiz-topic',

        // Navigation states
        'quiz-navigation-state',
        'quiz-current-question',
        'quiz-submission-states',
        'quiz-selected-answers',
        'quiz-card-states',
      ];

      let clearedCount = 0;
      keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });

      // Clear all daily attempt keys and any other dynamic keys
      const keysToScan = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keysToScan.push(key);
      }

      keysToScan.forEach(key => {
        if (
          key.startsWith('leitner-daily-attempts-') ||
          key.startsWith('submission-') ||
          key.startsWith('card-state-') ||
          key.includes('quiz') ||
          key.includes('leitner')
        ) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      });

      setClearResult(
        `🚀 COMPLETE RESET! Cleared ${clearedCount} total items. All quiz states cleared. Refresh the page for a fresh start.`
      );
    } catch (error) {
      setClearResult(`❌ Error clearing all states: ${error}`);
    }
  };

  // Clear application cache but preserve Leitner progress
  const clearApplicationCache = async () => {
    try {
      const clearedItems: string[] = [];

      // 1. Clear Service Worker caches (if any)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          clearedItems.push(`Cache: ${cacheName}`);
        }
      }

      // 2. Clear sessionStorage (temporary data)
      if (sessionStorage.length > 0) {
        const sessionCount = sessionStorage.length;
        sessionStorage.clear();
        clearedItems.push(`SessionStorage: ${sessionCount} items`);
      }

      // 3. Clear non-essential localStorage items (preserve Leitner data)
      const preserveKeys = [
        'leitner-progress',
        'leitner-settings',
        'leitner-stats',
      ];

      const itemsToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !preserveKeys.includes(key)) {
          itemsToRemove.push(key);
        }
      }

      itemsToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      if (itemsToRemove.length > 0) {
        clearedItems.push(
          `localStorage: ${itemsToRemove.length} non-essential items`
        );
      }

      setClearResult(
        `✅ Application cache cleared! Cleared: ${clearedItems.join(', ')}. ` +
          `Your Leitner progress is preserved. Please hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows).`
      );
    } catch (error) {
      setClearResult(`❌ Error clearing cache: ${error}`);
    }
  };

  // Force hard refresh with cache bypass
  const forceHardRefresh = () => {
    setClearResult('🔄 Performing hard refresh to bypass all caches...');
    // Use location.reload with force flag to bypass cache
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Show current localStorage content for debugging
  const showStorageDebug = () => {
    const storageItems: Record<string, string | null> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          storageItems[key] = value;
        } catch {
          storageItems[key] = 'Error reading value';
        }
      }
    }
    console.log('Current localStorage contents:', storageItems);
    setClearResult(
      '📋 localStorage contents logged to console (F12 > Console)'
    );
  };

  return (
    <div className='min-h-screen bg-background p-8'>
      <div className='mx-auto max-w-4xl space-y-8'>
        <h1 className='text-3xl font-bold'>Leitner Box Color Debug</h1>

        {!isMounted ? (
          <div className='flex items-center justify-center p-8'>
            <div className='text-muted-foreground'>
              Loading debug information...
            </div>
          </div>
        ) : (
          <>
            {/* Timezone Debug */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>
                Timezone Debug (Singapore UTC+8)
              </h2>
              {timezoneDebug && (
                <div className='space-y-4'>
                  <Card className='p-4'>
                    <h3 className='mb-2 font-semibold'>Basic Timezone Info</h3>
                    <div className='space-y-2 font-mono text-sm'>
                      <div>
                        <strong>Current Time:</strong>{' '}
                        {timezoneDebug.currentTime}
                      </div>
                      <div>
                        <strong>Local Date (Singapore):</strong>{' '}
                        {timezoneDebug.localDate}
                      </div>
                      <div>
                        <strong>UTC Date:</strong> {timezoneDebug.utcDate}
                      </div>
                      <div>
                        <strong>Timezone Offset:</strong>{' '}
                        {timezoneDebug.timezoneOffset} minutes
                      </div>
                      <div>
                        <strong>Test Due Today:</strong>{' '}
                        {timezoneDebug.testDueComparison
                          ? '✅ Working'
                          : '❌ Failed'}
                      </div>
                    </div>
                  </Card>

                  <Card className='p-4'>
                    <h3 className='mb-2 font-semibold'>
                      Streak Calculation Test
                    </h3>
                    <div className='space-y-2 font-mono text-sm'>
                      <div>
                        <strong>Current Streak:</strong>{' '}
                        {timezoneDebug.streakTest.currentStreak} days
                      </div>
                      <div>
                        <strong>Today Has Activity:</strong>{' '}
                        {timezoneDebug.streakTest.todayHasActivity
                          ? '✅ Yes'
                          : '❌ No'}
                      </div>
                      <div>
                        <strong>Sample Stored Date:</strong>{' '}
                        {timezoneDebug.streakTest.sampleStoredDate}
                      </div>
                      <div>
                        <strong>Converted to Local:</strong>{' '}
                        {timezoneDebug.streakTest.sampleConvertedDate}
                      </div>
                    </div>
                  </Card>

                  <Card className='p-4'>
                    <h3 className='mb-2 font-semibold'>Edge Case Tests</h3>
                    <div className='space-y-2 font-mono text-sm'>
                      <div>
                        <strong>Midnight Transition:</strong>{' '}
                        {timezoneDebug.edgeCaseTests.midnightTransition
                          ? '✅ Pass'
                          : '❌ Fail'}
                      </div>
                      <div>
                        <strong>DST Handling:</strong>{' '}
                        {timezoneDebug.edgeCaseTests.dstHandling
                          ? '✅ Pass'
                          : '❌ Fail'}
                      </div>
                      <div>
                        <strong>Leap Year:</strong>{' '}
                        {timezoneDebug.edgeCaseTests.leapYearHandling
                          ? '✅ Pass'
                          : '❌ Fail'}
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </section>

            {/* Question Pool Debug */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>Question Pool Analysis</h2>
              <Card className='p-4'>
                <h3 className='mb-4 font-semibold'>
                  Analyze Current Question Pool
                </h3>
                <p className='mb-4 text-sm text-muted-foreground'>
                  Debug why you might be getting the same questions. This
                  analyzes the current state of your question pool, box
                  distribution, and due questions.
                </p>
                <div className='space-y-3'>
                  <Button
                    onClick={debugQuestionPool}
                    variant='outline'
                    className='w-full'
                    disabled={loading}
                  >
                    🔍 Analyze Question Pool
                  </Button>

                  {questionPoolDebug && (
                    <div className='space-y-4'>
                      <Card className='p-4'>
                        <h4 className='mb-2 font-semibold'>Pool Overview</h4>
                        <div className='space-y-2 font-mono text-sm'>
                          <div>
                            <strong>Total Questions:</strong>{' '}
                            {questionPoolDebug.totalQuestions}
                          </div>
                          <div>
                            <strong>Filtered Questions:</strong>{' '}
                            {questionPoolDebug.filteredQuestions}
                          </div>
                          <div>
                            <strong>Due Questions:</strong>{' '}
                            {questionPoolDebug.dueQuestions}
                          </div>
                        </div>
                      </Card>

                      <Card className='p-4'>
                        <h4 className='mb-2 font-semibold'>Progress Stats</h4>
                        <div className='space-y-2 font-mono text-sm'>
                          <div>
                            <strong>Total in Progress:</strong>{' '}
                            {questionPoolDebug.progressStats.total}
                          </div>
                          <div>
                            <strong>Box 1 (Learning):</strong>{' '}
                            {questionPoolDebug.progressStats.box1}
                          </div>
                          <div>
                            <strong>Box 2 (Practicing):</strong>{' '}
                            {questionPoolDebug.progressStats.box2}
                          </div>
                          <div>
                            <strong>Box 3 (Mastered):</strong>{' '}
                            {questionPoolDebug.progressStats.box3}
                          </div>
                          <div>
                            <strong>New Questions:</strong>{' '}
                            {questionPoolDebug.progressStats.new}
                          </div>
                          <div>
                            <strong>Due Today:</strong>{' '}
                            {questionPoolDebug.progressStats.due}
                          </div>
                          <div>
                            <strong>Not Due:</strong>{' '}
                            {questionPoolDebug.progressStats.notDue}
                          </div>
                        </div>
                      </Card>

                      <Card className='p-4'>
                        <h4 className='mb-2 font-semibold'>
                          Sample Due Questions
                        </h4>
                        <div className='max-h-60 space-y-1 overflow-y-auto font-mono text-xs'>
                          {questionPoolDebug.sampleDueQuestions.map((q, i) => (
                            <div key={i} className='border-b pb-1'>
                              <div>
                                <strong>ID:</strong> ...{q.id}
                              </div>
                              <div>
                                <strong>Topic:</strong> {q.topic}
                              </div>
                              <div>
                                <strong>Box:</strong> {q.currentBox} |{' '}
                                <strong>Due:</strong> {q.isDue ? '✅' : '❌'}
                              </div>
                              <div>
                                <strong>Next Review:</strong> {q.nextReviewDate}
                              </div>
                              <div>
                                <strong>Correct/Incorrect:</strong>{' '}
                                {q.timesCorrect}/{q.timesIncorrect}
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className='p-4'>
                        <h4 className='mb-2 font-semibold'>
                          Topic Distribution
                        </h4>
                        <div className='grid grid-cols-2 gap-2 font-mono text-xs'>
                          {Object.entries(
                            questionPoolDebug.topicDistribution
                          ).map(([topic, count]) => (
                            <div key={topic}>
                              <strong>{topic}:</strong> {count}
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* Quiz Navigation Debug */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>
                🧭 Quiz Navigation Debug
              </h2>
              <Card className='p-4'>
                <h3 className='mb-4 font-semibold'>
                  Navigation State Analysis
                </h3>
                <p className='mb-4 text-sm text-muted-foreground'>
                  Analyze current quiz navigation state, localStorage contents,
                  and debug navigation issues.
                </p>

                <div className='space-y-3'>
                  <Button
                    onClick={analyzeNavigationState}
                    variant='outline'
                    className='w-full'
                    disabled={loading}
                  >
                    🔍 Analyze Current Navigation State
                  </Button>

                  {navigationDebug && (
                    <div className='space-y-4'>
                      {/* Current State Overview */}
                      <Card className='bg-blue-50 p-4 dark:bg-blue-950/20'>
                        <h4 className='mb-2 font-semibold text-blue-800 dark:text-blue-200'>
                          📊 Current State Overview
                        </h4>
                        <div className='space-y-2 font-mono text-sm'>
                          <div>
                            <strong>Active Mode:</strong>{' '}
                            <span
                              className={
                                navigationDebug.currentTopic === null
                                  ? 'text-purple-600'
                                  : 'text-green-600'
                              }
                            >
                              {navigationDebug.currentTopic === null
                                ? '🎯 Leitner (All Topics)'
                                : `📚 Practice (${navigationDebug.currentTopic})`}
                            </span>
                          </div>
                          <div>
                            <strong>Last Analysis:</strong>{' '}
                            {new Date().toLocaleTimeString()}
                          </div>
                        </div>
                      </Card>

                      {/* Practice State */}
                      <Card className='p-4'>
                        <h4 className='mb-2 font-semibold text-green-700 dark:text-green-300'>
                          📚 Practice Mode State
                        </h4>
                        <div className='grid grid-cols-2 gap-4 font-mono text-sm'>
                          <div>
                            <strong>Current Question:</strong> #
                            {navigationDebug.practiceState.currentIndex + 1}
                          </div>
                          <div>
                            <strong>Questions Answered:</strong>{' '}
                            {navigationDebug.practiceState.totalAnswered}
                          </div>
                          <div className='col-span-2'>
                            <strong>Practice Keys in localStorage:</strong>{' '}
                            {navigationDebug.localStorage.practiceKeys.length}
                          </div>
                        </div>

                        {navigationDebug.localStorage.practiceKeys.length >
                          0 && (
                          <details className='mt-3'>
                            <summary className='cursor-pointer text-sm font-medium text-muted-foreground'>
                              📋 Practice localStorage Keys (
                              {navigationDebug.localStorage.practiceKeys.length}
                              )
                            </summary>
                            <div className='mt-2 space-y-1 font-mono text-xs'>
                              {navigationDebug.localStorage.practiceKeys.map(
                                (item, idx) => (
                                  <div
                                    key={idx}
                                    className='rounded bg-gray-100 p-2 dark:bg-gray-800'
                                  >
                                    <div>
                                      <strong>{item.key}</strong> ({item.size})
                                    </div>
                                    <div className='truncate text-muted-foreground'>
                                      {JSON.stringify(
                                        item.value || 'null'
                                      ).substring(0, 100)}
                                      ...
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </details>
                        )}
                      </Card>

                      {/* Leitner State */}
                      <Card className='p-4'>
                        <h4 className='mb-2 font-semibold text-purple-700 dark:text-purple-300'>
                          🎯 Leitner Mode State
                        </h4>
                        <div className='grid grid-cols-2 gap-4 font-mono text-sm'>
                          <div>
                            <strong>Current Question:</strong> #
                            {navigationDebug.leitnerState.currentIndex + 1}
                          </div>
                          <div>
                            <strong>Questions Submitted:</strong>{' '}
                            {navigationDebug.leitnerState.totalSubmissions}
                          </div>
                          <div>
                            <strong>Due Today:</strong>{' '}
                            {navigationDebug.leitnerState.dueToday}
                          </div>
                          <div>
                            <strong>Leitner Keys:</strong>{' '}
                            {navigationDebug.localStorage.leitnerKeys.length}
                          </div>
                        </div>

                        {navigationDebug.localStorage.leitnerKeys.length >
                          0 && (
                          <details className='mt-3'>
                            <summary className='cursor-pointer text-sm font-medium text-muted-foreground'>
                              📋 Leitner localStorage Keys (
                              {navigationDebug.localStorage.leitnerKeys.length})
                            </summary>
                            <div className='mt-2 space-y-1 font-mono text-xs'>
                              {navigationDebug.localStorage.leitnerKeys.map(
                                (item, idx) => (
                                  <div
                                    key={idx}
                                    className='rounded bg-gray-100 p-2 dark:bg-gray-800'
                                  >
                                    <div>
                                      <strong>{item.key}</strong> ({item.size})
                                    </div>
                                    <div className='truncate text-muted-foreground'>
                                      {JSON.stringify(
                                        item.value || 'null'
                                      ).substring(0, 100)}
                                      ...
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </details>
                        )}
                      </Card>

                      {/* Other localStorage Keys */}
                      {navigationDebug.localStorage.otherKeys.length > 0 && (
                        <Card className='p-4'>
                          <h4 className='mb-2 font-semibold text-gray-700 dark:text-gray-300'>
                            🗃️ Other localStorage Keys
                          </h4>
                          <details>
                            <summary className='cursor-pointer text-sm font-medium text-muted-foreground'>
                              Show all other keys (
                              {navigationDebug.localStorage.otherKeys.length})
                            </summary>
                            <div className='mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-xs'>
                              {navigationDebug.localStorage.otherKeys.map(
                                (item, idx) => (
                                  <div
                                    key={idx}
                                    className='rounded bg-gray-50 p-2 dark:bg-gray-900'
                                  >
                                    <div>
                                      <strong>{item.key}</strong> ({item.size})
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </details>
                        </Card>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <Card className='p-4'>
                <h3 className='mb-4 font-semibold'>
                  🛠️ Navigation State Controls
                </h3>
                <p className='mb-4 text-sm text-muted-foreground'>
                  If you're experiencing navigation issues (stuck on a question,
                  wrong mode, etc.), use these controls to reset specific parts
                  of the navigation state.
                </p>
                <div className='space-y-3'>
                  <Button
                    onClick={clearQuizNavigationStates}
                    variant='outline'
                    className='w-full'
                  >
                    🧹 Clear Practice Navigation Only
                  </Button>

                  <Button
                    onClick={() => {
                      localStorage.removeItem('quiz-topic');
                      setClearResult(
                        '✅ Cleared current topic selection. App will default to Leitner mode.'
                      );
                    }}
                    variant='outline'
                    className='w-full'
                  >
                    🔄 Reset Topic Selection
                  </Button>

                  <Button
                    onClick={() => {
                      localStorage.removeItem('practice-quiz-index');
                      localStorage.removeItem('leitner-quiz-index');
                      setClearResult(
                        '✅ Reset question indices. You will start from question #1 in both modes.'
                      );
                    }}
                    variant='outline'
                    className='w-full'
                  >
                    ⏮️ Reset Question Indices
                  </Button>

                  <Button
                    onClick={clearAllQuizStates}
                    variant='destructive'
                    className='w-full'
                  >
                    🚀 COMPLETE RESET - Clear All Quiz States
                  </Button>

                  <Button
                    onClick={showStorageDebug}
                    variant='ghost'
                    className='w-full'
                  >
                    🔍 Show Raw Storage Debug Info
                  </Button>

                  {clearResult && (
                    <div className='rounded-md bg-muted p-3 text-sm'>
                      {clearResult}
                    </div>
                  )}
                </div>
              </Card>
            </section>

            {/* Cache Management */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>Cache Management</h2>
              <Card className='p-4'>
                <h3 className='mb-4 font-semibold'>Clear Application Cache</h3>
                <p className='mb-4 text-sm text-muted-foreground'>
                  If you're seeing old styling or the app isn't reflecting
                  recent updates, clear the cache below. Your Leitner progress
                  and question stats will be preserved.
                </p>
                <div className='space-y-3'>
                  <Button
                    onClick={clearApplicationCache}
                    variant='default'
                    className='w-full'
                  >
                    🗑️ Clear App Cache (Keep Progress)
                  </Button>
                  <Button
                    onClick={forceHardRefresh}
                    variant='secondary'
                    className='w-full'
                  >
                    🔄 Hard Refresh Page
                  </Button>
                  <div className='space-y-1 text-xs text-muted-foreground'>
                    <p>
                      <strong>Manual alternatives:</strong>
                    </p>
                    <p>• Mac: Cmd + Shift + R (hard refresh)</p>
                    <p>• Windows/Linux: Ctrl + Shift + R (hard refresh)</p>
                    <p>
                      • Or open DevTools (F12) → Network tab → check "Disable
                      cache"
                    </p>
                  </div>
                </div>
              </Card>
            </section>

            {/* Surface Classes Test */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>
                Surface Classes (leitner-box-surface-X)
              </h2>
              <div className='grid grid-cols-3 gap-4'>
                {boxes.map(box => (
                  <Card
                    key={box}
                    className={`leitner-box-surface-${box} min-h-[120px]`}
                  >
                    <CardHeader>
                      <CardTitle className={`leitner-box-text-${box}`}>
                        Box {box}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className={`leitner-box-text-${box}`}>
                      <p>Surface class test</p>
                      <p className='text-sm opacity-75'>
                        leitner-box-surface-{box}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Dot Classes Test */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>
                Dot Classes (leitner-box-dot-X)
              </h2>
              <div className='flex items-center gap-4'>
                {boxes.map(box => (
                  <div key={box} className='flex items-center gap-2'>
                    <span
                      className={`h-4 w-4 rounded-full leitner-box-dot-${box}`}
                    ></span>
                    <span>Box {box}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Text Classes Test */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>
                Text Classes (leitner-box-text-X)
              </h2>
              <div className='space-y-2'>
                {boxes.map(box => (
                  <p
                    key={box}
                    className={`leitner-box-text-${box} rounded p-2`}
                  >
                    Box {box} text color (leitner-box-text-{box})
                  </p>
                ))}
              </div>
            </section>

            {/* Background Classes Test */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>
                Background Classes (leitner-box-bg-X)
              </h2>
              <div className='grid grid-cols-3 gap-4'>
                {boxes.map(box => (
                  <div
                    key={box}
                    className={`leitner-box-bg-${box} flex min-h-[80px] items-center justify-center rounded p-4 text-center`}
                  >
                    Box {box} BG
                  </div>
                ))}
              </div>
            </section>

            {/* CSS Variable Test */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>CSS Variables Test</h2>
              <div className='grid grid-cols-3 gap-4'>
                {boxes.map(box => (
                  <div
                    key={box}
                    style={{
                      backgroundColor: `hsl(var(--box${box}-bg))`,
                      color: `hsl(var(--box${box}-fg))`,
                      border: `1px solid hsl(var(--box${box}-fg))`,
                    }}
                    className='flex min-h-[80px] items-center justify-center rounded p-4 text-center'
                  >
                    Box {box} CSS Vars
                  </div>
                ))}
              </div>
            </section>

            {/* Transparent Background Test */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>
                Transparent Background Classes
              </h2>
              <div className='grid grid-cols-3 gap-4'>
                {boxes.map(box => (
                  <div
                    key={box}
                    className={`leitner-box-surface-transparent-${box} flex min-h-[80px] items-center justify-center rounded border p-4 text-center`}
                  >
                    Box {box} Transparent
                  </div>
                ))}
              </div>
            </section>

            {/* Raw CSS Check */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>Manual CSS Test</h2>
              <div className='grid grid-cols-3 gap-4'>
                <div className='rounded bg-red-50 p-4 text-center text-red-800'>
                  Box 1 Manual
                </div>
                <div className='rounded bg-yellow-50 p-4 text-center text-yellow-800'>
                  Box 2 Manual
                </div>
                <div className='rounded bg-green-50 p-4 text-center text-green-800'>
                  Box 3 Manual
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
