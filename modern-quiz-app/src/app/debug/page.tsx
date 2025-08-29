'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { leitnerSystem } from '@/lib/leitner';
import { useEffect, useState } from 'react';

export default function DebugPage() {
  const boxes = [1, 2, 3]; // 3-box system only
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

  const [clearResult, setClearResult] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);

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
        'leitner-quiz-index',
        'leitner-submission-states',
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

      // Also look for any keys that might be question-specific submission states
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.startsWith('submission-') || key.startsWith('card-state-'))
        ) {
          localStorage.removeItem(key);
          clearedCount++;
        }
      }

      setClearResult(
        `✅ Cleared ${clearedCount} navigation state items. Your Leitner progress is preserved. Please refresh the page.`
      );
    } catch (error) {
      setClearResult(`❌ Error clearing states: ${error}`);
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

            {/* Question Randomization Controls */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>Question Randomization</h2>
              <Card className='p-4'>
                <h3 className='mb-4 font-semibold'>Refresh Question Order</h3>
                <p className='mb-4 text-sm text-muted-foreground'>
                  If you're seeing the same questions repeatedly, click below to 
                  shuffle the question order. This preserves your Leitner progress 
                  but gives you a fresh randomization of which questions appear.
                </p>
                <div className='space-y-3'>
                  <Button
                    onClick={() => {
                      leitnerSystem.refreshQuestionOrder();
                      setClearResult('✅ Question order refreshed! You should see different questions now.');
                    }}
                    variant='outline'
                    className='w-full'
                  >
                    🎲 Refresh Question Order
                  </Button>
                </div>
              </Card>
            </section>

            {/* Quiz Navigation Debug */}
            <section className='space-y-4'>
              <h2 className='text-xl font-semibold'>Quiz Navigation Debug</h2>
              <Card className='p-4'>
                <h3 className='mb-4 font-semibold'>Clear Navigation States</h3>
                <p className='mb-4 text-sm text-muted-foreground'>
                  If you're experiencing issues with quiz navigation (can't go
                  back/forward, answers not showing), click below to clear
                  navigation states. This preserves your Leitner progress and
                  stats.
                </p>
                <div className='space-y-3'>
                  <Button
                    onClick={clearQuizNavigationStates}
                    variant='outline'
                    className='w-full'
                  >
                    🧹 Clear Quiz Navigation States
                  </Button>
                  <Button
                    onClick={showStorageDebug}
                    variant='ghost'
                    className='w-full'
                  >
                    🔍 Show Storage Debug Info
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
