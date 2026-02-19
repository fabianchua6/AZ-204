'use client';

import { useEffect, useState, useRef } from 'react';
import { leitnerSystem } from '@/lib/leitner';
import { DateUtils } from '@/lib/leitner/utils';

const WEEKS = 15;

/** Delegate to canonical DateUtils */
const toLocalDateStr = (date: Date): string =>
  DateUtils.getLocalDateString(date);

function getCellColor(
  count: number,
  target: number,
  isFuture: boolean
): string {
  if (isFuture) return 'bg-transparent';
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

interface ActivityHeatmapProps {
  compact?: boolean;
}

export function ActivityHeatmap({ compact = false }: ActivityHeatmapProps) {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toLocalDateStr(today);

  // Start from the Sunday that places today in the rightmost column
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - today.getDay() - (WEEKS - 1) * 7);

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
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
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

  const gridTemplateColumns = `20px repeat(${WEEKS}, 1fr)`;

  const grid = (
    <div
      ref={containerRef}
      className='relative w-full select-none'
      onMouseLeave={() => setTooltip(null)}
    >
      {tooltip && (
        <div
          className='pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md'
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Month labels */}
      <div
        className='mb-1'
        style={{ display: 'grid', gridTemplateColumns, gap: '3px' }}
      >
        <div />
        {monthLabels.map((label, i) => (
          <div
            key={i}
            className='overflow-visible whitespace-nowrap text-[9px] leading-none text-muted-foreground'
          >
            {label ?? ''}
          </div>
        ))}
      </div>

      {/* Cell grid */}
      <div style={{ display: 'grid', gridTemplateColumns, gap: '3px' }}>
        {/* Day-of-week labels */}
        <div className='flex flex-col' style={{ gap: '3px' }}>
          {['', 'M', '', 'W', '', 'F', ''].map((label, i) => (
            <div
              key={i}
              className='flex aspect-square items-center justify-end pr-0.5 text-[8px] leading-none text-muted-foreground/60'
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {columns.map((week, wIdx) => (
          <div
            key={wIdx}
            className='flex flex-col'
            style={{ gap: '3px', overflow: 'visible' }}
          >
            {week.map((cell, dIdx) => (
              <div
                key={dIdx}
                onMouseEnter={e => handleMouseEnter(cell, e)}
                className={[
                  'relative z-0 aspect-square w-full cursor-default rounded-[2px]',
                  'transition-all duration-100 ease-out',
                  !cell.isFuture &&
                    'hover:z-10 hover:scale-[1.55] hover:shadow-md hover:brightness-110',
                  getCellColor(cell.count, dailyTarget, cell.isFuture),
                  cell.isToday
                    ? 'ring-1 ring-primary ring-offset-[1px] ring-offset-card'
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  if (compact) return grid;

  return (
    <div className='flex h-full w-full flex-col rounded-xl border border-border bg-card p-4 shadow-sm'>
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h3 className='text-sm font-semibold text-foreground'>
            Daily Activity
          </h3>
          <p className='text-xs text-muted-foreground'>Last {WEEKS} weeks</p>
        </div>
        <div className='flex gap-4 text-right'>
          <div>
            <p className='text-sm font-bold text-foreground'>
              {totalAnswered.toLocaleString()}
            </p>
            <p className='text-xs text-muted-foreground'>questions</p>
          </div>
          <div>
            <p className='text-sm font-bold tabular-nums text-foreground'>
              {activeDays}
            </p>
            <p className='text-xs text-muted-foreground'>active days</p>
          </div>
        </div>
      </div>

      <div className='mt-auto'>{grid}</div>
    </div>
  );
}
