'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Question } from '@/types/quiz';
import { isPdfQuestion } from '@/types/quiz';
import { leitnerSystem, type LeitnerStats } from '@/lib/leitner';
import { questionService } from '@/lib/question-service';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';

interface SubmissionState {
  isSubmitted: boolean;
  isCorrect: boolean;
  showAnswer: boolean;
  submittedAt: number;
  submittedAnswers: number[];
}

interface EnhancedQuizStats {
  // Traditional stats
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;

  // Leitner-specific stats
  leitner: LeitnerStats;
}

export function useQuizStateWithLeitner(
  questions: Question[],
  selectedTopic: string | null,
  setSelectedTopic: (topic: string | null) => void
) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [submissionStates, setSubmissionStates] = useState<Record<string, SubmissionState>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger for forcing re-evaluation of due questions
  const [isLoadingSession, setIsLoadingSession] = useState(true); // Loading state for session initialization
  
  // Use ref for session ending flag to avoid race conditions with setTimeout
  const isEndingSessionRef = useRef(false);
  
  // Initialize stats with safe defaults to prevent null reference errors
  const [stats, setStats] = useState<EnhancedQuizStats>(() => ({
    totalQuestions: 0,
    answeredQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    accuracy: 0,
    leitner: {
      totalQuestions: 0,
      questionsStarted: 0,
      boxDistribution: {},
      dueToday: 0,
      accuracyRate: 0,
      streakDays: 0,
    },
  }));

  // Simple in-place shuffle helper
  function shuffleArray<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // Load saved state (including submission states)
  // Use mode-specific localStorage key to avoid conflicts with practice mode
  // Only initialize if we're in Leitner mode (selectedTopic === null)
  useEffect(() => {
    if (selectedTopic !== null) {
      // Not in Leitner mode - don't initialize or interfere with state
      return;
    }
    
    // Load submission states immediately
    const savedSubmissionStates = loadFromLocalStorage('leitner-submission-states', {});
    setSubmissionStates(savedSubmissionStates);
    
    // Note: currentQuestionIndex will be validated separately after questions load
  }, [selectedTopic]); // Re-run when mode changes

  // Save state changes (including submission states)
  // Use mode-specific localStorage key to avoid conflicts with practice mode
  // Only save if we're in Leitner mode
  useEffect(() => {
    if (selectedTopic === null) {
      saveToLocalStorage('leitner-quiz-index', currentQuestionIndex);
    }
  }, [currentQuestionIndex, selectedTopic]);

  // Save submission states when they change - only in Leitner mode
  useEffect(() => {
    if (selectedTopic === null) {
      saveToLocalStorage('leitner-submission-states', submissionStates);
    }
  }, [submissionStates, selectedTopic]);

  // Filter and sort questions based on topic and Leitner system
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [isEndingSession, setIsEndingSession] = useState(false); // Flag to prevent regeneration during session end
  
  // Validate and restore currentQuestionIndex after questions load
  useEffect(() => {
    if (selectedTopic !== null || filteredQuestions.length === 0) {
      return;
    }
    
    const savedIndex = loadFromLocalStorage('leitner-quiz-index', 0);
    
    // Clamp index to valid range [0, filteredQuestions.length - 1]
    const validIndex = Math.min(savedIndex, filteredQuestions.length - 1);
    const clampedIndex = Math.max(0, validIndex);
    
    if (clampedIndex !== savedIndex) {
      console.log(`⚠️ Clamped questionIndex from ${savedIndex} to ${clampedIndex} (max: ${filteredQuestions.length - 1})`);
    }
    
    setCurrentQuestionIndex(clampedIndex);
  }, [filteredQuestions.length, selectedTopic]); // Run when questions are loaded

  // 🎯 Session state tracking for end session functionality
  const isSessionComplete = useMemo(() => {
    // For Leitner sessions, ignore topic filter - session completion is based on all session questions
    if (filteredQuestions.length === 0) {
      console.log('Session incomplete: No filtered questions');
      return false;
    }
    
    // Check if all questions in current session have been submitted
    // Only count submission states for questions that are actually in the current session
    const currentSessionQuestionIds = new Set(filteredQuestions.map(q => q.id));
    const submittedInCurrentSession = Object.keys(submissionStates).filter(questionId => 
      currentSessionQuestionIds.has(questionId) && submissionStates[questionId]?.isSubmitted
    ).length;
    
    const isComplete = submittedInCurrentSession === filteredQuestions.length && filteredQuestions.length > 0;
    
    console.log(`Session completion check:`, {
      submittedCount: submittedInCurrentSession,
      totalQuestions: filteredQuestions.length,
      isComplete,
      totalSubmissionStates: Object.keys(submissionStates).length,
      currentSessionQuestionIds: currentSessionQuestionIds.size,
      filteredQuestionIds: filteredQuestions.map(q => q.id).slice(0, 5),
      submissionStateKeys: Object.keys(submissionStates).slice(0, 10)
    });
    
    if (isComplete) {
      console.log(`✅ Session complete: ${submittedInCurrentSession}/${filteredQuestions.length} questions submitted`);
    }
    
    return isComplete;
  }, [filteredQuestions, submissionStates]);

  // Session results for end session display
  const sessionResults = useMemo(() => {
    if (!isSessionComplete) return null;
    
    const results = filteredQuestions.map(q => ({
      question: q,
      submission: submissionStates[q.id]
    }));
    
    const correct = results.filter(r => r.submission?.isCorrect).length;
    const incorrect = results.length - correct;
    
    return { correct, incorrect, total: results.length, results };
  }, [isSessionComplete, filteredQuestions, submissionStates]);

  // Session progress tracking - simplified for Leitner mode
  const sessionProgress = useMemo(() => {
    if (filteredQuestions.length === 0) {
      return { current: 0, total: 0, isActive: false };
    }
    
    const submittedCount = Object.keys(submissionStates).filter(questionId => 
      filteredQuestions.some(q => q.id === questionId) && submissionStates[questionId]?.isSubmitted
    ).length;
    
    const progress = {
      current: currentQuestionIndex + 1, // Which question we're currently on (1-based)
      total: filteredQuestions.length,
      isActive: !isSessionComplete && filteredQuestions.length > 0, // Active if not complete and has questions
    };
    
    console.log('📊 Session progress:', progress, {
      currentQuestionIndex,
      isSessionComplete,
      submittedCount
    });
    
    return progress;
  }, [filteredQuestions, submissionStates, currentQuestionIndex, isSessionComplete]);

  // Update filtered questions when dependencies change
  useEffect(() => {
    // Don't regenerate questions if we're ending a session (use ref for immediate check)
    if (isEndingSession || isEndingSessionRef.current) {
      console.log('⚠️ Skipping question regeneration - session is ending');
      return;
    }
    
    // Don't regenerate questions if session is complete - stay on results screen
    if (isSessionComplete) {
      console.log('⚠️ Skipping question regeneration - session is complete');
      return;
    }
    
    // Only run Leitner system logic when in Leitner mode
    if (selectedTopic !== null) {
      // In Practice mode - just use regular filtering without Leitner system
      const baseQuestions = questions.filter(question => {
        // Filter out code questions and questions with no select options
        if (question.hasCode) return false;
        if (question.options.length === 0) return false;
        return true;
      });
      
      // Filter by topic
      const topicFiltered = baseQuestions.filter(q => q.topic === selectedTopic);
      
      // Sort to prioritize PDF questions first (same as practice mode)
      topicFiltered.sort((a, b) => {
        const aIsPdf = isPdfQuestion(a);
        const bIsPdf = isPdfQuestion(b);
        
        if (aIsPdf && !bIsPdf) return -1;
        if (!aIsPdf && bIsPdf) return 1;
        return 0;
      });
      
      setFilteredQuestions(topicFiltered);
      return;
    }

    // Track if component is still mounted to prevent state updates after unmount
    let isMounted = true;

    const updateQuestions = async () => {
      try {
        setIsLoadingSession(true);
        await leitnerSystem.ensureInitialized();
        
        // Check if still mounted after async operation
        if (!isMounted) return;
        
        // Use centralized filtering first
        let baseQuestions = questionService.filterQuestions(questions);

        if (selectedTopic) {
          baseQuestions = baseQuestions.filter(q => q.topic === selectedTopic);
          
          // Sort to prioritize PDF questions first, then shuffle within each group
          const pdfQuestions = baseQuestions.filter(q => isPdfQuestion(q));
          const regularQuestions = baseQuestions.filter(q => !isPdfQuestion(q));
          
          // Shuffle each group separately, then combine with PDF questions first
          const shuffledPdf = shuffleArray(pdfQuestions);
          const shuffledRegular = shuffleArray(regularQuestions);
          baseQuestions = [...shuffledPdf, ...shuffledRegular];
          
          // Check again before setState
          if (!isMounted) return;
          setFilteredQuestions(baseQuestions);
          setIsLoadingSession(false);
        } else {
          // 🎯 SESSION-BASED: Try to restore existing session first
          const savedSession = loadFromLocalStorage<{
            questionIds: string[];
            createdAt: number;
          } | null>('leitner-current-session', null);
          
          const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
          const now = Date.now();
          
          // Check if we have a valid saved session that's not expired
          if (savedSession && 
              savedSession.questionIds && 
              Array.isArray(savedSession.questionIds) &&
              savedSession.questionIds.length > 0 &&
              (now - savedSession.createdAt) < SESSION_EXPIRY) {
            
            console.log('🔄 Restoring saved session with', savedSession.questionIds.length, 'questions');
            
            // Restore the exact same questions in the exact same order
            const restoredQuestions = savedSession.questionIds
              .map(id => baseQuestions.find(q => q.id === id))
              .filter((q): q is Question => q !== undefined);
            
            // Verify we restored most of the questions (at least 50%)
            if (restoredQuestions.length >= savedSession.questionIds.length * 0.5) {
              if (!isMounted) return;
              setFilteredQuestions(restoredQuestions);
              setIsLoadingSession(false);
              console.log('✅ Session restored:', restoredQuestions.length, 'questions');
              return; // Early exit - session restored successfully
            } else {
              console.log('⚠️ Saved session invalid - too few questions restored. Generating new session.');
            }
          }
          
          // No valid saved session - generate new one
          console.log('🆕 Generating new session');
          const dueQuestions = await leitnerSystem.getDueQuestions(baseQuestions);
          
          // Check if still mounted after async operation
          if (!isMounted) return;
          
          // Sort due questions to prioritize PDF questions first
          dueQuestions.sort((a, b) => {
            // PDF questions come first (handle undefined safely)
            const aIsPdf = isPdfQuestion(a);
            const bIsPdf = isPdfQuestion(b);
            
            if (aIsPdf && !bIsPdf) return -1;
            if (!aIsPdf && bIsPdf) return 1;
            // Within same type (PDF or regular), maintain Leitner system order
            return 0;
          });
          
          // 🎯 SESSION-BASED: Limit to 20 most due questions per session
          const sessionQuestions = dueQuestions.slice(0, 20);
          
          // Save the session to localStorage for restoration on refresh
          saveToLocalStorage('leitner-current-session', {
            questionIds: sessionQuestions.map(q => q.id),
            createdAt: now
          });
          
          console.log('💾 Saved new session:', sessionQuestions.length, 'questions');
          
          // Final mount check before setting state
          if (!isMounted) return;
          setFilteredQuestions(sessionQuestions);
          setIsLoadingSession(false);
          
          // Clear answer state for all due questions to ensure fresh review
          setAnswers(prev => {
            const cleaned = { ...prev };
            dueQuestions.forEach(question => {
              delete cleaned[question.id];
            });
            return cleaned;
          });
          
          // DO NOT clear submission states - this destroys user progress!
          // Submission states should persist to track completion progress
          // Only clear them explicitly when user chooses to reset progress
        }
      } catch (error) {
        console.error('Failed to update questions:', error);
        setIsLoadingSession(false);
        // Don't update state on error to maintain current questions
      }
    };

    updateQuestions();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [questions, selectedTopic, refreshTrigger, isEndingSession, isSessionComplete]); // Add refreshTrigger to refresh after clearing progress

  // Initialize and update stats when questions, topic, or force refresh change
  // Note: We don't include submissionStates here to avoid excessive recalculation
  useEffect(() => {
    if (questions.length > 0) {
      try {
        const filteredQs = questionService.filterQuestions(questions);
        const leitnerCompletion = leitnerSystem.getCompletionProgress(filteredQs);
        const leitnerStats = leitnerSystem.getStats(filteredQs);

        setStats({
          totalQuestions: leitnerCompletion.totalQuestions,
          answeredQuestions: leitnerCompletion.answeredQuestions,
          correctAnswers: leitnerCompletion.correctAnswers,
          incorrectAnswers: leitnerCompletion.incorrectAnswers,
          accuracy: leitnerCompletion.accuracy,
          leitner: leitnerStats,
        });
      } catch (error) {
        console.error('Failed to update stats:', error);
        // Keep existing stats on error - don't update
      }
    }
  }, [questions, selectedTopic, refreshTrigger]); // Removed submissionStates for performance

  // Separate effect to update stats when submissions change (debounced)
  useEffect(() => {
    if (questions.length === 0) return;

    const timeoutId = setTimeout(() => {
      try {
        const filteredQs = questionService.filterQuestions(questions);
        const leitnerCompletion = leitnerSystem.getCompletionProgress(filteredQs);
        const leitnerStats = leitnerSystem.getStats(filteredQs);

        setStats({
          totalQuestions: leitnerCompletion.totalQuestions,
          answeredQuestions: leitnerCompletion.answeredQuestions,
          correctAnswers: leitnerCompletion.correctAnswers,
          incorrectAnswers: leitnerCompletion.incorrectAnswers,
          accuracy: leitnerCompletion.accuracy,
          leitner: leitnerStats,
        });
      } catch (error) {
        console.error('Failed to update stats after submission:', error);
      }
    }, 300); // 300ms debounce for better performance on rapid submissions

    return () => clearTimeout(timeoutId);
  }, [submissionStates, questions, selectedTopic]);

  // Reset current question index when topic changes
  useEffect(() => {
    setCurrentQuestionIndex(0);
  }, [selectedTopic]);

  // Clear stale answer state (for questions no longer in current session)
  useEffect(() => {
    if (filteredQuestions.length === 0) return;
    
    // Only clean answers for questions that are NOT in the current filtered set
    // This prevents memory leaks while preserving current user selections
    const currentQuestionIds = new Set(filteredQuestions.map(q => q.id));
    
    setAnswers(prev => {
      const cleaned = { ...prev };
      Object.keys(cleaned).forEach(questionId => {
        if (!currentQuestionIds.has(questionId)) {
          delete cleaned[questionId]; // Only delete answers for questions not in current session
        }
      });
      return cleaned;
    });
  }, [filteredQuestions]); // Only run when filtered questions change, not on navigation

  // Clean up submission states for questions not in current session
  // BUT protect recently submitted answers (within last hour) to prevent data loss on refresh
  useEffect(() => {
    if (filteredQuestions.length === 0) return;
    if (isSessionComplete) return; // Don't clean if session just completed
    
    const currentQuestionIds = new Set(filteredQuestions.map(q => q.id));
    const RECENT_THRESHOLD = 60 * 60 * 1000; // 1 hour in milliseconds
    const now = Date.now();
    
    setSubmissionStates(prev => {
      const cleaned = { ...prev };
      let hasChanges = false;
      
      // Remove submission states for questions NOT in current session
      // BUT keep if they were submitted recently (within last hour)
      Object.keys(cleaned).forEach(questionId => {
        const state = cleaned[questionId];
        const isRecent = state && (now - state.submittedAt) < RECENT_THRESHOLD;
        
        if (!currentQuestionIds.has(questionId) && !isRecent) {
          delete cleaned[questionId];
          hasChanges = true;
        }
      });
      
      // Only update if there were actual changes
      if (hasChanges) {
        console.log('🧹 Cleaned up old submission states (kept recent submissions)');
        // Update localStorage to reflect the cleaned state
        saveToLocalStorage('leitner-submission-states', cleaned);
        return cleaned;
      }
      
      return prev;
    });
  }, [filteredQuestions, isSessionComplete]); // Run when questions change (new session loaded)

  // Separate function for just updating selected answers (no Leitner processing)
  const updateSelectedAnswers = useCallback(
    (questionId: string, answerIndexes: number[]) => {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answerIndexes,
      }));
    },
    []
  );

  // Actions - No memoization needed as setState functions are stable
  // Using function form of setState to always get latest state and avoid stale closures
  const actions = {
    setSelectedTopic: (topic: string | null) => {
      setSelectedTopic(topic);
    },

    // For option selection (no Leitner processing)
    updateAnswers: (questionId: string, answerIndexes: number[]) => {
      updateSelectedAnswers(questionId, answerIndexes);
    },

    // For answer submission (with Leitner processing)
    submitAnswer: async (questionId: string, answerIndexes: number[]) => {
      if (!questions || questions.length === 0) {
        console.error('[Leitner] No questions available');
        return;
      }

      // First update the local answers state for immediate UI feedback
      setAnswers(prev => ({
        ...prev,
        [questionId]: answerIndexes,
      }));

      // Find the question to check correctness
      const question = questions.find(q => q.id === questionId);
      if (!question) {
        console.error('[Leitner] Question not found', { questionId });
        return;
      }

      // Check if answer is correct
      const isCorrect =
        answerIndexes.length === question.answerIndexes.length &&
        answerIndexes.every(answer =>
          question.answerIndexes.includes(answer)
        );

      // Store submission state with submitted answers
      setSubmissionStates(prev => {
        const newState = {
          ...prev,
          [questionId]: {
            isSubmitted: true,
            isCorrect,
            showAnswer: true,
            submittedAt: Date.now(),
            submittedAnswers: answerIndexes, // Store the submitted answers
          },
        };
        
        // Save to localStorage for mobile persistence
        saveToLocalStorage('leitner-submission-states', newState);
        
        return newState;
      });

      try {
        console.log(`🔍 [DEBUG] submitAnswer called: questionId=${questionId.slice(-8)}, answerIndexes=[${answerIndexes.join(',')}]`);
        
        // Ensure Leitner system is initialized first
        await leitnerSystem.ensureInitialized();
        
        console.log(`🔍 [DEBUG] Leitner system initialized, processing answer: isCorrect=${isCorrect}`);
        
        // Process with Leitner system (synchronous operation)
        const result = leitnerSystem.processAnswer(questionId, isCorrect);

        console.log(`🔍 [DEBUG] Leitner processAnswer result:`, result);

        // Stats are updated inline with submission state to prevent race conditions
        // No separate updateStatsAfterSubmission call needed

        // Return result for UI feedback without auto-navigation
        return result;
      } catch (error) {
        console.error('🔍 [DEBUG] [Leitner] Failed to process answer:', error);
        throw error;
      }
    },

    // Legacy method for compatibility (now just updates answers)
    setAnswer: (questionId: string, answerIndexes: number[]) => {
      updateSelectedAnswers(questionId, answerIndexes);
    },

    nextQuestion: () => {
      setCurrentQuestionIndex(prev => {
        // Use function form to get latest state
        if (prev < filteredQuestions.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    },

    previousQuestion: () => {
      setCurrentQuestionIndex(prev => {
        // Use function form to get latest state
        if (prev > 0) {
          return prev - 1;
        }
        return prev;
      });
    },

    goToQuestion: (index: number) => {
      if (index >= 0 && index < filteredQuestions.length) {
        setCurrentQuestionIndex(index);
        
        // Don't clear any states - preserve both answer selections and submission states
        // This allows users to navigate freely while maintaining their progress
      }
    },

    clearAllProgress: () => {
      leitnerSystem.clearProgress();
      setRefreshTrigger(prev => prev + 1);
    },

    // Expose submission state for a question (used by UI to highlight wrong selections)
    getSubmissionState: (questionId: string) => {
      return submissionStates[questionId] || null;
    },

    // 🎯 Start new session function  
    startNewSession: () => {
      console.log('🚀 Starting new session - clearing all states');
      setCurrentQuestionIndex(0);
      setAnswers({}); // Clear all answer selections
      setSubmissionStates({}); // Clear all submission states
      setIsEndingSession(false); // Clear ending session flag
      isEndingSessionRef.current = false; // Clear ref flag
      setRefreshTrigger(prev => prev + 1); // Force refresh of due questions
      
      // Also clear localStorage states to ensure completely fresh start
      saveToLocalStorage('leitner-quiz-index', 0);
      saveToLocalStorage('leitner-submission-states', {});
      saveToLocalStorage('leitner-current-session', null); // Clear saved session
    },

    // 🎯 End current session early
    endCurrentSession: () => {
      console.log('🚨 endCurrentSession called');
      
      // Set both state and ref flag to prevent question regeneration
      setIsEndingSession(true);
      isEndingSessionRef.current = true;
      
      // Use function form to get latest state
      setSubmissionStates(prev => {
        console.log('Current state:', {
          filteredQuestionsCount: filteredQuestions.length,
          submissionStatesCount: Object.keys(prev).length,
          filteredQuestionIds: filteredQuestions.map(q => q.id),
          submissionStateIds: Object.keys(prev)
        });
        
        // Clear any current answer selections immediately
        setAnswers({});
        
        // Mark all remaining questions as "session ended" to trigger session complete
        const remainingQuestions = filteredQuestions.filter(q => 
          !prev[q.id]?.isSubmitted
        );
        
        console.log(`📝 Ending session: ${remainingQuestions.length} remaining questions out of ${filteredQuestions.length} total`);
        console.log('Remaining question IDs:', remainingQuestions.map(q => q.id));
        console.log('Already submitted IDs:', filteredQuestions.filter(q => prev[q.id]?.isSubmitted).map(q => q.id));
        
        const endSessionStates = { ...prev };
        remainingQuestions.forEach(q => {
          console.log(`Marking question ${q.id} as session-ended`);
          endSessionStates[q.id] = {
            isSubmitted: true,
            isCorrect: false, // Mark as incorrect for stats purposes
            showAnswer: false,
            submittedAt: Date.now(),
            submittedAnswers: [],
          };
        });
        
        console.log('Updated submission states count:', Object.keys(endSessionStates).length);
        console.log('Questions that will be submitted after update:', Object.keys(endSessionStates).filter(id => endSessionStates[id].isSubmitted).length);
        
        // Don't trigger refresh that would regenerate questions - let the session complete naturally
        console.log('🔄 Session ending - preventing question regeneration');
        
        return endSessionStates;
      });
      
      // Reset flags after session completion is processed
      // Use ref to track state immediately, then sync with state
      setTimeout(() => {
        isEndingSessionRef.current = false;
        setIsEndingSession(false);
      }, 2000);
    },
  };

  // Removed render debug log

  // Reactive question progress that updates when answers change
  const getQuestionProgress = useCallback(
    (questionId: string) => {
      // This will be called fresh each time refreshTrigger changes
      return leitnerSystem.getQuestionProgress(questionId);
    },
    [] // Remove refreshTrigger dependency as it's not actually needed
  );

  return {
    currentQuestionIndex,
    selectedTopic,
    filteredQuestions,
    answers,
    stats,
    actions,
    getQuestionProgress,
    // 🎯 Session-based functionality
    isSessionComplete,
    sessionResults,
    sessionProgress,
    isLoadingSession, // Add loading state for UI
  };
}
