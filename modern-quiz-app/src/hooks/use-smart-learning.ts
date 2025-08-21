'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Question } from '@/types/quiz';
import type {
  LearningRecord,
  StudySession,
  LearningMetrics,
  SmartQuizSettings,
} from '@/types/learning';

const STORAGE_KEYS = {
  LEARNING_RECORDS: 'quiz-learning-records',
  STUDY_SESSIONS: 'quiz-study-sessions',
  SETTINGS: 'quiz-smart-settings',
} as const;

export function useSmartLearning(questions: Question[]) {
  const [learningRecords, setLearningRecords] = useState<
    Map<string, LearningRecord>
  >(new Map());
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(
    null
  );
  const [settings, setSettings] = useState<SmartQuizSettings>({
    strategy: 'active_recall',
    sessionLength: 20,
    newQuestionRatio: 0.3,
    difficultyPreference: 'adaptive',
  });

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedRecords = localStorage.getItem(STORAGE_KEYS.LEARNING_RECORDS);
      if (savedRecords) {
        const recordsArray: [string, LearningRecord][] = JSON.parse(savedRecords);
        const recordsMap = new Map<string, LearningRecord>(
          recordsArray.map(([id, r]) => [
            id,
            {
              ...r,
              lastAnswered: new Date(r.lastAnswered),
              nextReviewDate: new Date(r.nextReviewDate),
            },
          ])
        );
        setLearningRecords(recordsMap);
      }

      const savedSessions = localStorage.getItem(STORAGE_KEYS.STUDY_SESSIONS);
      if (savedSessions) {
        const sessions = JSON.parse(savedSessions).map((s: StudySession) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
        }));
        setStudySessions(sessions);
      }

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading smart learning data:', error);
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (learningRecords.size > 0) {
      const recordsArray = Array.from(learningRecords.entries()).map(
        ([id, record]) => [
          id,
          {
            ...record,
            lastAnswered: record.lastAnswered.toISOString(),
            nextReviewDate: record.nextReviewDate.toISOString(),
          },
        ]
      );
      localStorage.setItem(
        STORAGE_KEYS.LEARNING_RECORDS,
        JSON.stringify(recordsArray)
      );
    }
  }, [learningRecords]);

  useEffect(() => {
    if (studySessions.length > 0) {
      localStorage.setItem(
        STORAGE_KEYS.STUDY_SESSIONS,
        JSON.stringify(studySessions)
      );
    }
  }, [studySessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Calculate next review date using spaced repetition algorithm
  const calculateNextReview = useCallback(
    (record: LearningRecord, wasCorrect: boolean): Date => {
      const now = new Date();
      let intervalDays = 1;

      if (wasCorrect) {
        // Successful recall - increase interval
        switch (record.streak) {
          case 0:
            intervalDays = 1;
            break;
          case 1:
            intervalDays = 3;
            break;
          case 2:
            intervalDays = 7;
            break;
          case 3:
            intervalDays = 14;
            break;
          case 4:
            intervalDays = 30;
            break;
          default:
            intervalDays = Math.min(90, 30 * Math.pow(1.5, record.streak - 4));
        }
      } else {
        // Failed recall - reset to shorter interval
        intervalDays = Math.max(1, Math.floor(intervalDays / 2));
      }

      // Adjust based on difficulty
      if (record.difficulty === 'hard') intervalDays *= 0.8;
      if (record.difficulty === 'easy') intervalDays *= 1.3;

      return new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    },
    []
  );

  // Record answer for a question
  const recordAnswer = useCallback(
    (
      questionId: string,
      wasCorrect: boolean,
      timeSpent: number,
      topic: string
    ) => {
      setLearningRecords(prev => {
        const newRecords = new Map(prev);
        const existing = newRecords.get(questionId);
        const now = new Date();

        const record: LearningRecord = existing
          ? {
              ...existing,
              attempts: existing.attempts + 1,
              correctCount: existing.correctCount + (wasCorrect ? 1 : 0),
              incorrectCount: existing.incorrectCount + (wasCorrect ? 0 : 1),
              lastAnswered: now,
              streak: wasCorrect ? existing.streak + 1 : 0,
              confidence: Math.max(
                0,
                Math.min(1, existing.confidence + (wasCorrect ? 0.1 : -0.2))
              ),
            }
          : {
              questionId,
              attempts: 1,
              correctCount: wasCorrect ? 1 : 0,
              incorrectCount: wasCorrect ? 0 : 1,
              lastAnswered: now,
              difficulty: 'medium',
              confidence: wasCorrect ? 0.6 : 0.3,
              nextReviewDate: now,
              streak: wasCorrect ? 1 : 0,
            };

        // Update difficulty based on performance
        const accuracy = record.correctCount / record.attempts;
        if (accuracy >= 0.8 && record.streak >= 2) {
          record.difficulty = 'easy';
        } else if (accuracy <= 0.4 || timeSpent > 120) {
          record.difficulty = 'hard';
        } else {
          record.difficulty = 'medium';
        }

        record.nextReviewDate = calculateNextReview(record, wasCorrect);
        newRecords.set(questionId, record);
        return newRecords;
      });

      // Update current session
      if (currentSession) {
        setCurrentSession(prev =>
          prev
            ? {
                ...prev,
                questionsAnswered: prev.questionsAnswered + 1,
                correctAnswers: prev.correctAnswers + (wasCorrect ? 1 : 0),
                topics: Array.from(new Set([...prev.topics, topic])),
              }
            : null
        );
      }
    },
    [calculateNextReview, currentSession]
  );

  // Get smart question ordering based on strategy
  const getSmartQuestionOrder = useCallback(
    (questions: Question[]): Question[] => {
      const now = new Date();

      // Categorize questions
      const categorized = questions.map(q => {
        const record = learningRecords.get(q.id);
        return {
          question: q,
          record,
          isDue: record ? record.nextReviewDate <= now : true,
          isNew: !record,
          isMastered: record
            ? record.streak >= 3 && record.confidence >= 0.8
            : false,
          isStruggling: record
            ? record.correctCount / record.attempts < 0.5
            : false,
          priority: 0, // Will be calculated based on strategy
        };
      });

      // Calculate priority based on strategy
      categorized.forEach(item => {
        const { record, isDue, isNew, isMastered, isStruggling } = item;

        switch (settings.strategy) {
          case 'spaced_repetition':
            if (isDue && !isMastered) item.priority = 100;
            else if (isNew) item.priority = 50;
            else item.priority = 10;
            break;

          case 'active_recall':
            if (isStruggling) item.priority = 100;
            else if (isDue) item.priority = 80;
            else if (isNew) item.priority = 60;
            else item.priority = 30;
            break;

          case 'weak_areas':
            if (isStruggling) item.priority = 100;
            else if (record && record.confidence < 0.6) item.priority = 70;
            else item.priority = 20;
            break;

          case 'quick_review':
            if (isMastered) item.priority = 100;
            else if (record && record.confidence >= 0.7) item.priority = 80;
            else item.priority = 30;
            break;

          case 'comprehensive':
          default:
            if (isDue) item.priority = 80;
            else if (isNew) item.priority = 60;
            else item.priority = 40;
        }

        // Add randomness to prevent predictable patterns
        item.priority += Math.random() * 10;
      });

      // Sort by priority and return questions
      return categorized
        .sort((a, b) => b.priority - a.priority)
        .map(item => item.question);
    },
    [learningRecords, settings.strategy]
  );

  // Get learning metrics
  const getLearningMetrics = useCallback((): LearningMetrics => {
    const records = Array.from(learningRecords.values());
    const totalQuestions = questions.length;
    const answeredQuestions = records.length;

    const masteredQuestions = records.filter(
      r => r.streak >= 3 && r.confidence >= 0.8
    ).length;

    const strugglingQuestions = records.filter(
      r => r.attempts >= 2 && r.correctCount / r.attempts < 0.5
    ).length;

    const now = new Date();
    const reviewDueQuestions = records.filter(
      r => r.nextReviewDate <= now && r.streak < 3
    ).length;

    const averageConfidence =
      answeredQuestions > 0
        ? records.reduce((sum, r) => sum + r.confidence, 0) / answeredQuestions
        : 0;

    // Calculate topic performance
    const topicStats = new Map<string, { correct: number; total: number }>();
    questions.forEach(q => {
      const record = learningRecords.get(q.id);
      if (record && record.attempts > 0) {
        const stats = topicStats.get(q.topic) || { correct: 0, total: 0 };
        stats.correct += record.correctCount;
        stats.total += record.attempts;
        topicStats.set(q.topic, stats);
      }
    });

    const topicAccuracies = Array.from(topicStats.entries())
      .map(([topic, stats]) => ({
        topic,
        accuracy: stats.correct / stats.total,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);

    const strongTopics = topicAccuracies
      .filter(t => t.accuracy >= 0.7)
      .map(t => t.topic);

    const weakTopics = topicAccuracies
      .filter(t => t.accuracy < 0.5)
      .map(t => t.topic);

    return {
      totalQuestions,
      masteredQuestions,
      strugglingQuestions,
      reviewDueQuestions,
      averageConfidence,
      strongTopics,
      weakTopics,
    };
  }, [learningRecords, questions]);

  // Start a study session
  const startSession = useCallback(() => {
    const session: StudySession = {
      id: Date.now().toString(),
      startTime: new Date(),
      questionsAnswered: 0,
      correctAnswers: 0,
      topics: [],
      averageTimePerQuestion: 0,
    };
    setCurrentSession(session);
  }, []);

  // End current study session
  const endSession = useCallback(() => {
    if (currentSession) {
      const endedSession = {
        ...currentSession,
        endTime: new Date(),
        averageTimePerQuestion:
          currentSession.questionsAnswered > 0
            ? (Date.now() - currentSession.startTime.getTime()) /
              (currentSession.questionsAnswered * 1000)
            : 0,
      };

      setStudySessions(prev => [...prev, endedSession]);
      setCurrentSession(null);
    }
  }, [currentSession]);

  return {
    learningRecords,
    studySessions,
    currentSession,
    settings,
    setSettings,
    recordAnswer,
    getSmartQuestionOrder,
    getLearningMetrics,
    startSession,
    endSession,
  };
}
