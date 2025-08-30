// Recommended optimized implementation
// Replace the current stats calculation with this approach

export function useQuizStateWithLeitner(
questions: Question[],
selectedTopic: string | null,
setSelectedTopic: (topic: string | null) => void
) {
// ... existing state ...

// Remove both forceTick and statsRefreshTrigger
// Replace with single optimized stats state
const [stats, setStats] = useState<EnhancedQuizStats | null>(null);

// Initialize stats once
useEffect(() => {
const initializeStats = async () => {
await leitnerSystem.ensureInitialized();
const filteredQuestions = questionService.filterQuestions(questions);
const completion = leitnerSystem.getCompletionProgress(filteredQuestions);
const leitnerStats = leitnerSystem.getStats(filteredQuestions);

      setStats({
        totalQuestions: completion.totalQuestions,
        answeredQuestions: completion.answeredQuestions,
        correctAnswers: completion.correctAnswers,
        incorrectAnswers: completion.incorrectAnswers,
        accuracy: completion.accuracy,
        leitner: leitnerStats,
      });
    };

    initializeStats();

}, [questions]); // Only recalculate when questions change

// Incremental stats update after submission
const updateStatsAfterSubmission = useCallback((isCorrect: boolean) => {
setStats(prevStats => {
if (!prevStats) return prevStats;

      const newAnsweredQuestions = prevStats.answeredQuestions + 1;
      const newCorrectAnswers = isCorrect
        ? prevStats.correctAnswers + 1
        : prevStats.correctAnswers;
      const newIncorrectAnswers = !isCorrect
        ? prevStats.incorrectAnswers + 1
        : prevStats.incorrectAnswers;

      return {
        ...prevStats,
        answeredQuestions: newAnsweredQuestions,
        correctAnswers: newCorrectAnswers,
        incorrectAnswers: newIncorrectAnswers,
        accuracy: newAnsweredQuestions > 0
          ? (newCorrectAnswers / newAnsweredQuestions) * 100
          : 0,
        leitner: {
          ...prevStats.leitner,
          dueToday: Math.max(0, prevStats.leitner.dueToday - 1),
        }
      };
    });

}, []);

// Optimized submit answer function
const submitAnswer = useCallback(async (questionId: string, answerIndexes: number[]) => {
// ... existing submission logic ...

    const result = leitnerSystem.processAnswer(questionId, isCorrect);

    // Update stats incrementally instead of full recalculation
    updateStatsAfterSubmission(isCorrect);

    return result;

}, [updateStatsAfterSubmission]);

return {
// ... existing returns ...
stats: stats || defaultStats, // Provide fallback
// ... rest of actions ...
};
}
