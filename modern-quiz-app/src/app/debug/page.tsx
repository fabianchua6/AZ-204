'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  useEffect(() => {
    // Debug timezone handling
    const debug = leitnerSystem.debugTimezone();
    setTimezoneDebug(debug);
  }, []);

  return (
    <div className='min-h-screen bg-background p-8'>
      <div className='mx-auto max-w-4xl space-y-8'>
        <h1 className='text-3xl font-bold'>Leitner Box Color Debug</h1>

        {/* Timezone Debug */}
        <section className='space-y-4'>
          <h2 className='text-xl font-semibold'>Timezone Debug (Singapore UTC+8)</h2>
          {timezoneDebug && (
            <div className="space-y-4">
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Basic Timezone Info</h3>
                <div className="space-y-2 text-sm font-mono">
                  <div><strong>Current Time:</strong> {timezoneDebug.currentTime}</div>
                  <div><strong>Local Date (Singapore):</strong> {timezoneDebug.localDate}</div>
                  <div><strong>UTC Date:</strong> {timezoneDebug.utcDate}</div>
                  <div><strong>Timezone Offset:</strong> {timezoneDebug.timezoneOffset} minutes</div>
                  <div><strong>Test Due Today:</strong> {timezoneDebug.testDueComparison ? '✅ Working' : '❌ Failed'}</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Streak Calculation Test</h3>
                <div className="space-y-2 text-sm font-mono">
                  <div><strong>Current Streak:</strong> {timezoneDebug.streakTest.currentStreak} days</div>
                  <div><strong>Today Has Activity:</strong> {timezoneDebug.streakTest.todayHasActivity ? '✅ Yes' : '❌ No'}</div>
                  <div><strong>Sample Stored Date:</strong> {timezoneDebug.streakTest.sampleStoredDate}</div>
                  <div><strong>Converted to Local:</strong> {timezoneDebug.streakTest.sampleConvertedDate}</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <h3 className="font-semibold mb-2">Edge Case Tests</h3>
                <div className="space-y-2 text-sm font-mono">
                  <div><strong>Midnight Transition:</strong> {timezoneDebug.edgeCaseTests.midnightTransition ? '✅ Pass' : '❌ Fail'}</div>
                  <div><strong>DST Handling:</strong> {timezoneDebug.edgeCaseTests.dstHandling ? '✅ Pass' : '❌ Fail'}</div>
                  <div><strong>Leap Year:</strong> {timezoneDebug.edgeCaseTests.leapYearHandling ? '✅ Pass' : '❌ Fail'}</div>
                </div>
              </Card>
            </div>
          )}
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
              <p key={box} className={`leitner-box-text-${box} rounded p-2`}>
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
      </div>
    </div>
  );
}
