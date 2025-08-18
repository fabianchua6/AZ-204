import { BarChart3, Target, CheckCircle, XCircle } from 'lucide-react';
import type { QuizStats as QuizStatsType } from '@/types/quiz';

interface QuizStatsProps {
  stats: QuizStatsType;
}

export function QuizStats({ stats }: QuizStatsProps) {
  const { totalQuestions, answeredQuestions, correctAnswers, incorrectAnswers, accuracy } = stats;
  
  return (
    <div className="bg-card border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Progress</h2>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{totalQuestions}</div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{answeredQuestions}</div>
          <div className="text-sm text-muted-foreground">Answered</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{correctAnswers}</span>
          </div>
          <div className="text-sm text-muted-foreground">Correct</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <Target className="h-4 w-4 text-orange-600" />
            <span className="text-2xl font-bold text-orange-600">{accuracy}%</span>
          </div>
          <div className="text-sm text-muted-foreground">Accuracy</div>
        </div>
      </div>
      
      {answeredQuestions > 0 && (
        <div className="mt-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(answeredQuestions / totalQuestions) * 100}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {Math.round((answeredQuestions / totalQuestions) * 100)}% Complete
          </div>
        </div>
      )}
    </div>
  );
}
