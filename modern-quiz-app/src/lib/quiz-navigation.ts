export interface QuizNavigationState {
  showAnswer: boolean;
  hasAnswers: boolean;
  canGoNext: boolean;
  canGoPrevious: boolean;
  answerSubmitted: boolean;
  isSubmitting: boolean;
}

export interface QuizNavigationActions {
  onShowAnswer: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSubmitAnswer?: () => void;
}

export function createNavigationHandler(
  state: QuizNavigationState,
  actions: QuizNavigationActions
) {
  const handleShowAnswer = () => {
    actions.onShowAnswer();
  };

  const handleNext = () => {
    // For practice mode - show answer first if not shown and has answers
    if (!state.showAnswer && state.hasAnswers && !state.answerSubmitted) {
      actions.onShowAnswer();
    } else {
      actions.onNext();
    }
  };

  const handlePrevious = () => {
    actions.onPrevious();
  };

  const handleSubmitAnswer = () => {
    if (
      actions.onSubmitAnswer &&
      state.hasAnswers &&
      !state.isSubmitting &&
      !state.answerSubmitted
    ) {
      actions.onSubmitAnswer();
    }
  };

  return {
    handleShowAnswer,
    handleNext,
    handlePrevious,
    handleSubmitAnswer,
  };
}

export function getNavigationButtonStates(state: QuizNavigationState) {
  return {
    showAnswerDisabled: false,
    nextDisabled: !state.canGoNext || state.isSubmitting,
    previousDisabled: !state.canGoPrevious || state.isSubmitting,
    submitDisabled:
      !state.hasAnswers || state.isSubmitting || state.answerSubmitted,
    showSubmitButton: !state.answerSubmitted && state.hasAnswers,
  };
}
