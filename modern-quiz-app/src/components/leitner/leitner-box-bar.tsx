'use client';

interface LeitnerBoxBarProps {
  boxDistribution: Record<number, number>;
  totalQuestions: number;
}

export function LeitnerBoxBar({
  boxDistribution,
  totalQuestions,
}: LeitnerBoxBarProps) {
  return (
    <div className='flex flex-col gap-3'>
      {/* Segmented Bar - 3 Box System */}
      <div className='flex w-full overflow-hidden rounded-xl border border-border/60'>
        {[1, 2, 3].map((boxNumber, idx) => {
          const questionCount = boxDistribution[boxNumber] || 0;
          const percentage =
            totalQuestions > 0 ? (questionCount / totalQuestions) * 100 : 0;
          // Use actual percentage for proportional sizing, with small minimum for visibility
          const flexGrow = questionCount > 0 ? Math.max(percentage, 5) : 1;

          const segmentBgClass = `leitner-box-surface-${boxNumber}`;
          const segmentTextClass = `leitner-box-text-${boxNumber}`;

          return (
            <div
              key={boxNumber}
              className={`group relative flex flex-col items-center justify-center px-3 py-4 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 ${segmentBgClass} ${segmentTextClass} ${idx !== 0 ? 'border-l-2 border-white/20 dark:border-black/20' : ''}`}
              style={{
                flexGrow,
                minWidth: '60px',
                minHeight: '60px',
              }}
              tabIndex={0}
              aria-label={`Box ${boxNumber}: ${questionCount} questions (${percentage.toFixed(1)}%)`}
              title={`Box ${boxNumber} • ${questionCount} (${percentage.toFixed(1)}%)`}
            >
              <span className='absolute left-1 top-1 rounded-sm bg-black/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide dark:bg-white/10'>
                {boxNumber}
              </span>
              <span className='text-sm font-semibold tabular-nums sm:text-base'>
                {questionCount}
              </span>
              <div className='pointer-events-none absolute inset-0 rounded-md bg-black opacity-0 transition-opacity group-hover:opacity-[0.06] group-focus-visible:opacity-[0.10] dark:bg-white' />
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className='flex flex-wrap gap-x-4 gap-y-1.5 text-xs'>
        {[1, 2, 3].map(boxNumber => {
          const questionCount = boxDistribution[boxNumber] || 0;
          const percentage =
            totalQuestions > 0
              ? Math.round((questionCount / totalQuestions) * 100)
              : 0;
          const dotClass = `leitner-box-dot-${boxNumber}`;
          return (
            <div
              key={boxNumber}
              className='flex items-center gap-1 text-muted-foreground'
            >
              <span className={`h-2 w-2 rounded-full ${dotClass}`}></span>
              <span className='font-medium text-foreground'>{boxNumber}</span>
              <span className='tabular-nums text-foreground/80'>
                {questionCount}
              </span>
              <span className='opacity-60'>({percentage}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
