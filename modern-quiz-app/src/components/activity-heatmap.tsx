'use client';

import { useEffect, useState, useRef } from 'react';
import { leitnerSystem } from '@/lib/leitner';

const WEEKS = 12;

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCellColor(
  count: number,
  target: number,
  isFuture: boolean
): string {
  if (isFuture) return 'bg-transparent border border-dashed border-border/30';
  if (count === 0) return 'bg-muted/60';
  const pct = count / target;
  if (pct < 0.25) return 'bg-green-200 dark:bg-green-900/70';
  if (pct < 0.5) return 'bg-green-300 dark:bg-green-700/80';
  if (pct < 0.75) return 'bg-green-400 dark:bg-green-600';
  if (pct < 1.0) return 'bg-green-500 dark:bg-green-500';
  return 'bg-green-600 dark:bg-green-400';
}

interface Cell {
  dateStr: string;
  count: number;
  isToday: boolean;
  isFuture: boolean;
}

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

export function ActivityHeatmap() {
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [dailyTarget, setDailyTarget] = useState(20);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    leitnerSystem.ensureInitialized().then(() => {
      setActivity(leitnerSystem.getDailyActivityHistory());
      setDailyTarget(leitnerSystem.getDailyTarget());
    });
  }, []);

  // Build grid: 12 columns (weeks), 7 rows (Sun–Sat)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateStr(today);

  // Find the starting Sunday: go back WEEKS*7 days then snap to Sunday
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (WEEKS * 7 - 1));
  // Move back to the previous Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Build columns[week][dayOfWeek]
  const columns: Cell[][] = [];
  for (let w = 0; w < WEEKS; w++) {
    const week: Cell[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(startDate);
      dt.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = toLocalDateStr(dt);
      week.push({
        dateStr,
        count: activity[dateStr] ?? 0,
        isToday: dateStr === todayStr,
        isFuture: dt > today,
      });
    }
    columns.push(week);
  }

  // Month labels: attach to the first column where the month appears
  const monthLabels: (string | null)[] = Array(WEEKS).fill(null);
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const month = new Date(columns[w][0].dateStr + 'T00:00:00').getMonth();
    if (month !== lastMonth) {
      const dt = new Date(columns[w][0].dateStr + 'T00:00:00');
      monthLabels[w] = dt.toLocaleString('default', { month: 'short' });
      lastMonth = month;
    }
  }

  const totalAnswered = Object.values(activity).reduce((a, b) => a + b, 0);
  const activeDays = Object.values(activity).filter(v => v > 0).length;

  const handleMouseEnter = (cell: Cell, e: React.MouseEvent) => {
    if (cell.isFuture) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const label = cell.isToday
      ? 'Today'
      : new Date(cell.dateStr + 'T00:00:00').toLocaleDateString('default', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
    const text =
      cell.count === 0
        ? `No activity — ${label}`
        : `${cell.count} question${cell.count !== 1 ? 's' : ''} — ${label}`;

    setTooltip({
      text,
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8,
    });
  };

  return (
    <div className='rounded-xl border border-border bg-card p-5 shadow-sm'>
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h3 className='text-sm font-semibold text-foreground'>
            Daily Activity
          </h3>
          <p className='text-xs text-muted-foreground'>Last 12 weeks</p>
        </div>
        <div className='flex gap-4 text-right'>
          <div>
            <p className='text-sm font-bold text-foreground'>
              {totalAnswered.toLocaleString()}
            </p>
            <p className='text-xs text-muted-foreground'>questions</p>
          </div>
          <div>
            <p className='text-sm font-bold text-foreground'>{activeDays}</p>
            <p className='text-xs text-muted-foreground'>active days</p>
          </div>
        </div>
      </div>

      <div ref={containerRef} className='relative select-none overflow-x-auto'>
        {/* Tooltip */}
        {tooltip && (
          <div
            className='pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md'
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.text}
          </div>
        )}

        <div className='min-w-max' onMouseLeave={() => setTooltip(null)}>
          {/* Month row */}
          <div className='mb-1 flex'>
            {/* Day-label spacer */}
            <div className='w-7 shrink-0' />
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className='w-[14px] shrink-0 text-[10px] leading-none text-muted-foreground'
                style={{ width: 14 }}
              >
                {label ? (
                  <span className='absolute whitespace-nowrap'>{label}</span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          <div className='flex gap-[3px]'>
            {/* Day-of-week labels */}
            <div className='flex w-7 shrink-0 flex-col justify-around gap-[3px]'>
              {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((label, i) => (
                <div
                  key={i}
                  className='h-[11px] text-[9px] leading-none text-muted-foreground/70'
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {columns.map((week, wIdx) => (
              <div key={wIdx} className='flex flex-col gap-[3px]'>
                {week.map((cell, dIdx) => (
                  <div
                    key={dIdx}
                    onMouseEnter={e => handleMouseEnter(cell, e)}
                    className={`h-[11px] w-[11px] cursor-default rounded-[2px] transition-opacity hover:opacity-80 ${getCellColor(cell.count, dailyTarget, cell.isFuture)} ${cell.isToday ? 'ring-1 ring-primary ring-offset-1 ring-offset-card' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className='mt-3 flex items-center justify-end gap-1.5'>
            <span className='text-[10px] text-muted-foreground'>Less</span>
            {[
              'bg-muted/60',
              'bg-green-200 dark:bg-green-900/70',
              'bg-green-300 dark:bg-green-700/80',
              'bg-green-500 dark:bg-green-500',
              'bg-green-600 dark:bg-green-400',
            ].map((cls, i) => (
              <div
                key={i}
                className={`h-[11px] w-[11px] rounded-[2px] ${cls}`}
              />
            ))}
            <span className='text-[10px] text-muted-foreground'>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
