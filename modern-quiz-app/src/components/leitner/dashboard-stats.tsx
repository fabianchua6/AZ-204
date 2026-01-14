'use client';

import type { LeitnerStats } from '@/lib/leitner';

interface DashboardStatsProps {
    stats: {
        leitner: LeitnerStats;
    };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
    return (
        <div className='mx-auto max-w-2xl'>
            <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
                <div className='rounded-lg border bg-card p-4'>
                    <div className='text-2xl font-bold text-primary'>
                        {stats.leitner.questionsStarted}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                        Questions Started
                    </div>
                </div>
                <div className='rounded-lg border bg-card p-4'>
                    <div className='text-2xl font-bold text-success dark:text-emerald-400'>
                        {stats.leitner.accuracyRate.toFixed(0)}%
                    </div>
                    <div className='text-sm text-muted-foreground'>
                        Accuracy Rate
                    </div>
                </div>
                <div className='rounded-lg border bg-card p-4'>
                    <div className='text-2xl font-bold text-primary dark:text-blue-400'>
                        {stats.leitner.streakDays}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                        Day Streak
                    </div>
                </div>
            </div>

            {/* Box distribution */}
            <div className='rounded-lg border bg-card p-4'>
                <h3 className='mb-3 font-medium'>Progress by Box</h3>
                <div className='grid grid-cols-3 gap-3 text-sm'>
                    <div className='text-center'>
                        <div className='text-lg font-bold text-destructive dark:text-red-400'>
                            {stats.leitner.boxDistribution[1] || 0}
                        </div>
                        <div className='text-muted-foreground'>Box 1 (New)</div>
                    </div>
                    <div className='text-center'>
                        <div className='text-lg font-bold text-warning dark:text-amber-400'>
                            {stats.leitner.boxDistribution[2] || 0}
                        </div>
                        <div className='text-muted-foreground'>Box 2 (Learning)</div>
                    </div>
                    <div className='text-center'>
                        <div className='text-lg font-bold text-success dark:text-emerald-400'>
                            {stats.leitner.boxDistribution[3] || 0}
                        </div>
                        <div className='text-muted-foreground'>Box 3 (Mastered)</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
