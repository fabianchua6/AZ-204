'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { leitnerSystem } from '@/lib/leitner';
import { useQuizData } from '@/hooks/use-quiz-data';
import { questionService } from '@/lib/question-service';
import { useEffect, useState } from 'react';
import {
  Database,
  Clock,
  Navigation,
  Trash2,
  RefreshCw,
  Palette,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  Bug,
  HardDrive,
} from 'lucide-react';

// Collapsible Section Component
function DebugSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  variant = 'default',
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  variant?: 'default' | 'danger' | 'warning';
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const variantStyles = {
    default: 'border-border',
    danger: 'border-destructive/30 bg-destructive/5',
    warning: 'border-warning/30 bg-warning/5',
  };

  return (
    <Card className={`overflow-hidden ${variantStyles[variant]}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="border-t p-4">{children}</div>}
    </Card>
  );
}

// Status Badge Component
function StatusBadge({ status, label }: { status: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {status ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  );
}

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Bug className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Debug Console</h1>
              <p className="text-sm text-muted-foreground">
                Developer tools for troubleshooting and system diagnostics
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        {!isMounted ? (
          <div className="flex items-center justify-center rounded-lg border bg-card p-12">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-muted-foreground">Loading debug information...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Status Result Banner */}
            {clearResult && (
              <div
                className={`rounded-lg border p-4 ${
                  clearResult.includes('❌')
                    ? 'border-destructive/30 bg-destructive/5 text-destructive'
                    : clearResult.includes('🚀')
                    ? 'border-primary/30 bg-primary/5 text-primary'
                    : 'border-green-500/30 bg-green-500/5 text-green-700 dark:text-green-400'
                }`}
              >
                <p className="text-sm font-medium">{clearResult}</p>
              </div>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <RefreshCw className="h-4 w-4" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common debugging operations and cache management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <Button
                    onClick={() => {
                      leitnerSystem.refreshQuestionOrder();
                      setClearResult('✅ Question order refreshed! You should see different questions now.');
                    }}
                    variant="outline"
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-lg">🎲</span>
                      <span className="text-xs">Shuffle Questions</span>
                    </div>
                  </Button>
                  <Button
                    onClick={forceHardRefresh}
                    variant="outline"
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <RefreshCw className="h-4 w-4" />
                      <span className="text-xs">Hard Refresh</span>
                    </div>
                  </Button>
                  <Button
                    onClick={clearApplicationCache}
                    variant="outline"
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Trash2 className="h-4 w-4" />
                      <span className="text-xs">Clear Cache</span>
                    </div>
                  </Button>
                  <Button
                    onClick={showStorageDebug}
                    variant="outline"
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <HardDrive className="h-4 w-4" />
                      <span className="text-xs">Log Storage</span>
                    </div>
                  </Button>
                  <Button
                    onClick={clearAllQuizStates}
                    variant="destructive"
                    className="h-auto py-3"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">Reset All</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* System Diagnostics */}
            <DebugSection title="System Diagnostics" icon={Clock} defaultOpen>
              <div className="space-y-4">
                {/* Timezone Info */}
                {timezoneDebug && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="p-4">
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                        Timezone
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Time</span>
                          <span className="font-mono">{timezoneDebug.currentTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Local Date</span>
                          <span className="font-mono">{timezoneDebug.localDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">UTC Date</span>
                          <span className="font-mono">{timezoneDebug.utcDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Offset</span>
                          <span className="font-mono">{timezoneDebug.timezoneOffset} min</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                        Streak Test
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Current Streak</span>
                          <span className="font-mono">
                            {timezoneDebug.streakTest.currentStreak} days
                          </span>
                        </div>
                        <StatusBadge
                          status={timezoneDebug.streakTest.todayHasActivity}
                          label="Today has activity"
                        />
                        <StatusBadge
                          status={timezoneDebug.testDueComparison}
                          label="Due comparison working"
                        />
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                        Edge Cases
                      </h4>
                      <div className="space-y-2">
                        <StatusBadge
                          status={timezoneDebug.edgeCaseTests.midnightTransition}
                          label="Midnight transition"
                        />
                        <StatusBadge
                          status={timezoneDebug.edgeCaseTests.dstHandling}
                          label="DST handling"
                        />
                        <StatusBadge
                          status={timezoneDebug.edgeCaseTests.leapYearHandling}
                          label="Leap year handling"
                        />
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </DebugSection>

            {/* Question Pool Analysis */}
            <DebugSection title="Question Pool Analysis" icon={Database}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Analyze the current state of your question pool, box distribution, and due
                  questions.
                </p>
                <Button
                  onClick={debugQuestionPool}
                  variant="outline"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  <Database className="mr-2 h-4 w-4" />
                  Analyze Question Pool
                </Button>

                {questionPoolDebug && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="p-4">
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                        Overview
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-mono font-semibold">
                            {questionPoolDebug.totalQuestions}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Filtered</span>
                          <span className="font-mono">
                            {questionPoolDebug.filteredQuestions}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Due Today</span>
                          <span className="font-mono text-primary font-semibold">
                            {questionPoolDebug.dueQuestions}
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                        Box Distribution
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Box 1 (Learning)</span>
                          <span className="font-mono">
                            {questionPoolDebug.progressStats.box1}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Box 2 (Practicing)</span>
                          <span className="font-mono">
                            {questionPoolDebug.progressStats.box2}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Box 3 (Mastered)</span>
                          <span className="font-mono">
                            {questionPoolDebug.progressStats.box3}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">New</span>
                          <span className="font-mono">
                            {questionPoolDebug.progressStats.new}
                          </span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                        Topic Distribution
                      </h4>
                      <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
                        {Object.entries(questionPoolDebug.topicDistribution).map(
                          ([topic, count]) => (
                            <div key={topic} className="flex justify-between">
                              <span className="truncate text-muted-foreground">{topic}</span>
                              <span className="font-mono">{count}</span>
                            </div>
                          )
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {questionPoolDebug && questionPoolDebug.sampleDueQuestions.length > 0 && (
                  <details className="rounded-lg border p-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      Sample Due Questions ({questionPoolDebug.sampleDueQuestions.length})
                    </summary>
                    <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
                      {questionPoolDebug.sampleDueQuestions.map((q, i) => (
                        <div
                          key={i}
                          className="rounded bg-muted/50 p-2 font-mono text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="truncate">...{q.id}</span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] ${
                                q.isDue
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {q.isDue ? 'Due' : 'Not Due'}
                            </span>
                          </div>
                          <div className="mt-1 text-muted-foreground">
                            {q.topic} • Box {q.currentBox} • {q.timesCorrect}✓ /{' '}
                            {q.timesIncorrect}✗
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </DebugSection>

            {/* Navigation State */}
            <DebugSection title="Navigation State" icon={Navigation}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Debug quiz navigation issues, mode switching, and localStorage state.
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={analyzeNavigationState}
                    variant="outline"
                    disabled={loading}
                  >
                    Analyze Navigation
                  </Button>
                  <Button onClick={clearQuizNavigationStates} variant="outline">
                    Clear Practice State
                  </Button>
                  <Button
                    onClick={() => {
                      localStorage.removeItem('quiz-topic');
                      setClearResult('✅ Topic selection reset');
                    }}
                    variant="outline"
                  >
                    Reset Topic
                  </Button>
                  <Button
                    onClick={() => {
                      localStorage.removeItem('practice-quiz-index');
                      localStorage.removeItem('leitner-quiz-index');
                      setClearResult('✅ Question indices reset');
                    }}
                    variant="outline"
                  >
                    Reset Indices
                  </Button>
                </div>

                {navigationDebug && (
                  <div className="space-y-4">
                    {/* Current Mode */}
                    <Card className="bg-primary/5 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Active Mode</span>
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-medium ${
                            navigationDebug.currentTopic === null
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          }`}
                        >
                          {navigationDebug.currentTopic === null
                            ? '🎯 Leitner (All Topics)'
                            : `📚 Practice (${navigationDebug.currentTopic})`}
                        </span>
                      </div>
                    </Card>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Practice State */}
                      <Card className="p-4">
                        <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                          📚 Practice Mode
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Current Question</span>
                            <span className="font-mono">
                              #{navigationDebug.practiceState.currentIndex + 1}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Answered</span>
                            <span className="font-mono">
                              {navigationDebug.practiceState.totalAnswered}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Storage Keys</span>
                            <span className="font-mono">
                              {navigationDebug.localStorage.practiceKeys.length}
                            </span>
                          </div>
                        </div>
                      </Card>

                      {/* Leitner State */}
                      <Card className="p-4">
                        <h4 className="mb-3 text-sm font-semibold text-muted-foreground">
                          🎯 Leitner Mode
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Current Question</span>
                            <span className="font-mono">
                              #{navigationDebug.leitnerState.currentIndex + 1}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Submitted</span>
                            <span className="font-mono">
                              {navigationDebug.leitnerState.totalSubmissions}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Due Today</span>
                            <span className="font-mono text-primary font-semibold">
                              {navigationDebug.leitnerState.dueToday}
                            </span>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Storage Details */}
                    <details className="rounded-lg border p-4">
                      <summary className="cursor-pointer text-sm font-medium">
                        localStorage Details (
                        {navigationDebug.localStorage.practiceKeys.length +
                          navigationDebug.localStorage.leitnerKeys.length +
                          navigationDebug.localStorage.otherKeys.length}{' '}
                        keys)
                      </summary>
                      <div className="mt-4 space-y-4">
                        {navigationDebug.localStorage.leitnerKeys.length > 0 && (
                          <div>
                            <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
                              Leitner Keys
                            </h5>
                            <div className="space-y-1">
                              {navigationDebug.localStorage.leitnerKeys.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 font-mono text-xs"
                                >
                                  <span className="truncate">{item.key}</span>
                                  <span className="text-muted-foreground">{item.size}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {navigationDebug.localStorage.practiceKeys.length > 0 && (
                          <div>
                            <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
                              Practice Keys
                            </h5>
                            <div className="space-y-1">
                              {navigationDebug.localStorage.practiceKeys.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 font-mono text-xs"
                                >
                                  <span className="truncate">{item.key}</span>
                                  <span className="text-muted-foreground">{item.size}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            </DebugSection>

            {/* Cache Management */}
            <DebugSection title="Cache Management" icon={Trash2}>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Clear application cache to fix styling issues or stale data. Your Leitner
                  progress will be preserved.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={clearApplicationCache} variant="default" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear App Cache (Keep Progress)
                  </Button>
                  <Button onClick={forceHardRefresh} variant="secondary" className="w-full">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Hard Refresh Page
                  </Button>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  <p className="font-medium">Manual refresh shortcuts:</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    <li>Mac: ⌘ + Shift + R</li>
                    <li>Windows/Linux: Ctrl + Shift + R</li>
                    <li>DevTools: F12 → Network → "Disable cache"</li>
                  </ul>
                </div>
              </div>
            </DebugSection>

            {/* CSS Debug - Collapsible */}
            <DebugSection title="CSS & Theme Testing" icon={Palette}>
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Visual tests for Leitner box styling and theme consistency.
                </p>

                {/* Surface Classes */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Surface Classes</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {boxes.map(box => (
                      <div
                        key={box}
                        className={`leitner-box-surface-${box} rounded-lg p-4 text-center`}
                      >
                        <div className="text-lg font-bold">Box {box}</div>
                        <div className="text-xs opacity-75">surface-{box}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dot Classes */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Dot Classes</h4>
                  <div className="flex items-center gap-6">
                    {boxes.map(box => (
                      <div key={box} className="flex items-center gap-2">
                        <span
                          className={`h-4 w-4 rounded-full leitner-box-dot-${box}`}
                        />
                        <span className="text-sm">Box {box}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transparent Backgrounds */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Transparent Backgrounds</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {boxes.map(box => (
                      <div
                        key={box}
                        className={`leitner-box-surface-transparent-${box} rounded-lg border p-4 text-center`}
                      >
                        <div className="text-sm font-medium">Box {box}</div>
                        <div className="text-xs opacity-75">transparent</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CSS Variables */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">CSS Variables (Direct)</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {boxes.map(box => (
                      <div
                        key={box}
                        style={{
                          backgroundColor: `hsl(var(--box${box}-bg))`,
                          color: `hsl(var(--box${box}-fg))`,
                          border: `1px solid hsl(var(--box${box}-fg))`,
                        }}
                        className="rounded-lg p-4 text-center"
                      >
                        <div className="text-sm font-medium">Box {box}</div>
                        <div className="text-xs opacity-75">var(--box{box})</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tailwind Fallback */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Tailwind Fallback</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-red-50 p-4 text-center text-red-800 dark:bg-red-900/20 dark:text-red-400">
                      Box 1
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-4 text-center text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      Box 2
                    </div>
                    <div className="rounded-lg bg-green-50 p-4 text-center text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      Box 3
                    </div>
                  </div>
                </div>
              </div>
            </DebugSection>
          </>
        )}
      </div>
    </div>
  );
}
