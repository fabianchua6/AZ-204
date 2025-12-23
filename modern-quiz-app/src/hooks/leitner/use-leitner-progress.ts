'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveToLocalStorage, loadFromLocalStorage } from '@/lib/utils';
import type { Question } from '@/types/quiz';
import { debug } from '@/lib/logger';

export interface SubmissionState {
    isSubmitted: boolean;
    isCorrect: boolean;
    showAnswer: boolean;
    submittedAt: number;
    submittedAnswers: number[];
}

export function useLeitnerProgress(filteredQuestions: Question[]) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number[]>>({});
    const [submissionStates, setSubmissionStates] = useState<Record<string, SubmissionState>>({});

    // Load persistence
    useEffect(() => {
        // Load submission states
        const savedStates = loadFromLocalStorage('leitner-submission-states', {});
        setSubmissionStates(savedStates);

        // Load saved index
        const savedIndex = loadFromLocalStorage('leitner-quiz-index', 0);
        if (filteredQuestions.length > 0) {
            const validIndex = Math.min(savedIndex, filteredQuestions.length - 1);
            const clampedIndex = Math.max(0, validIndex);
            setCurrentQuestionIndex(clampedIndex);
        }
    }, [filteredQuestions.length]); // Re-run when questions set changes (e.g. new session)

    // Save persistence
    useEffect(() => {
        saveToLocalStorage('leitner-quiz-index', currentQuestionIndex);
    }, [currentQuestionIndex]);

    useEffect(() => {
        saveToLocalStorage('leitner-submission-states', submissionStates);
    }, [submissionStates]);

    // Clean stale state when questions change
    useEffect(() => {
        if (filteredQuestions.length === 0) return;

        const currentIds = new Set(filteredQuestions.map(q => q.id));

        setAnswers(prev => {
            const next = { ...prev };
            let changed = false;
            Object.keys(next).forEach(key => {
                if (!currentIds.has(key)) {
                    delete next[key];
                    changed = true;
                }
            });
            return changed ? next : prev;
        });

        // We purposely do NOT clear submissionStates aggressively here to avoid losing history 
        // if the user refreshes. Cleaning effectively happens when a new session overrides them 
        // or when we explicitly clear them.
    }, [filteredQuestions]);

    const goToQuestion = useCallback((index: number) => {
        if (index >= 0 && index < filteredQuestions.length) {
            setCurrentQuestionIndex(index);
        }
    }, [filteredQuestions.length]);

    const nextQuestion = useCallback(() => {
        goToQuestion(currentQuestionIndex + 1);
    }, [currentQuestionIndex, goToQuestion]);

    const previousQuestion = useCallback(() => {
        goToQuestion(currentQuestionIndex - 1);
    }, [currentQuestionIndex, goToQuestion]);

    const updateAnswers = useCallback((questionId: string, answerIndexes: number[]) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answerIndexes
        }));
    }, []);

    const submitQuestion = useCallback((questionId: string, answerIndexes: number[], isCorrect: boolean) => {
        setSubmissionStates(prev => ({
            ...prev,
            [questionId]: {
                isSubmitted: true,
                isCorrect,
                showAnswer: true,
                submittedAt: Date.now(),
                submittedAnswers: answerIndexes
            }
        }));

        // Note: Caller is responsible for Leitner system processing (business logic)
    }, []);

    const resetProgress = useCallback(() => {
        debug('🧹 Resetting progress state');
        setCurrentQuestionIndex(0);
        setAnswers({});
        setSubmissionStates({});
        saveToLocalStorage('leitner-quiz-index', 0);
        saveToLocalStorage('leitner-submission-states', {});
    }, []);

    return {
        currentQuestionIndex,
        answers,
        submissionStates,
        goToQuestion,
        nextQuestion,
        previousQuestion,
        updateAnswers,
        submitQuestion,
        resetProgress,
        getSubmissionState: (id: string) => submissionStates[id] || null
    };
}
