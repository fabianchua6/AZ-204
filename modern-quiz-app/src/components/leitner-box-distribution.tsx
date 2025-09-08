import { leitnerSystem } from '@/lib/leitner';
import { Question } from '@/types/quiz';

interface LeitnerBoxDistributionProps {
  questions: Question[];
  className?: string;
}

export function LeitnerBoxDistribution({ questions, className = '' }: LeitnerBoxDistributionProps) {
  const stats = leitnerSystem.getStats(questions);
  const boxDistribution = stats.boxDistribution;
  const total = boxDistribution[1] + boxDistribution[2] + boxDistribution[3];

  if (total === 0) {
    return (
      <div className={`bg-card rounded-lg p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-card-foreground mb-3">Question Distribution</h3>
        <div className="text-sm text-muted-foreground">No questions available</div>
      </div>
    );
  }

  const learningWidth = (boxDistribution[1] / total) * 100;
  const practicingWidth = (boxDistribution[2] / total) * 100;
  const masteredWidth = (boxDistribution[3] / total) * 100;

  return (
    <div className={`bg-card rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-card-foreground mb-3">Question Distribution</h3>
      
      {/* Progress Bar */}
      <div className="w-full bg-muted rounded-full h-3 mb-4 overflow-hidden">
        <div className="h-full flex">
          {learningWidth > 0 && (
            <div 
              className="bg-red-500 h-full transition-all duration-300"
              style={{ width: `${learningWidth}%` }}
            />
          )}
          {practicingWidth > 0 && (
            <div 
              className="bg-yellow-500 h-full transition-all duration-300"
              style={{ width: `${practicingWidth}%` }}
            />
          )}
          {masteredWidth > 0 && (
            <div 
              className="bg-green-500 h-full transition-all duration-300"
              style={{ width: `${masteredWidth}%` }}
            />
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-muted-foreground">Learning</span>
          <span className="font-medium text-card-foreground">{boxDistribution[1]}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-muted-foreground">Practicing</span>
          <span className="font-medium text-card-foreground">{boxDistribution[2]}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-muted-foreground">Mastered</span>
          <span className="font-medium text-card-foreground">{boxDistribution[3]}</span>
        </div>
      </div>
    </div>
  );
}
