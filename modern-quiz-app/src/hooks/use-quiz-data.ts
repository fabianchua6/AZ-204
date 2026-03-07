'use client';

import { useMemo } from 'react';
import type { Question } from '@/types/quiz';

// Statically import the JSON payloads natively.
// Webpack automatically parses and bundles these objects into memory synchronously.
import topicsData from '@/data/topics.json';
import questionsData from '@/data/questions.json';
import pdfQuestionsData from '@/data/pdf-questions.json';

export function useQuizData() {
  const { questions, topics } = useMemo(() => {
    // Merge and prioritize PDF questions just like before
    // PDF questions come first, then regular questions
    const allQuestions = [
      ...(pdfQuestionsData as Question[]),
      ...(questionsData as Question[]),
    ];

    // Extract unique topics from both regular and PDF questions
    const allTopics = new Set([...(topicsData as string[])]);

    // Add topics from PDF questions that might not be in the original topics list
    (pdfQuestionsData as Question[]).forEach(q => {
      if (q.topic) {
        allTopics.add(q.topic);
      }
    });

    return {
      questions: allQuestions,
      topics: Array.from(allTopics).sort(),
    };
  }, []);

  // Return synchronous load state variables cleanly mapped off as complete.
  return {
    questions,
    topics,
    loading: false, // Legacy fallback maintained for dependents
    error: null,
  };
}
