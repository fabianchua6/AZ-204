'use client';

import { useState, useEffect } from 'react';
import type { Question } from '@/types/quiz';

export function useQuizData() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Load topics
        const topicsResponse = await fetch('/data/topics.json');
        if (!topicsResponse.ok) throw new Error('Failed to load topics');
        const topicsData = await topicsResponse.json();

        // Load regular questions
        const questionsResponse = await fetch('/data/questions.json');
        if (!questionsResponse.ok) throw new Error('Failed to load questions');
        const regularQuestions = await questionsResponse.json();

        // Load PDF questions
        let pdfQuestions: Question[] = [];
        try {
          const pdfResponse = await fetch('/data/pdf-questions.json');
          if (pdfResponse.ok) {
            pdfQuestions = await pdfResponse.json();
          }
        } catch (pdfError) {
          console.warn('PDF questions not available:', pdfError);
        }

        // Merge and prioritize PDF questions
        // PDF questions come first, then regular questions
        const allQuestions = [...pdfQuestions, ...regularQuestions];

        // Extract unique topics from both regular and PDF questions
        const allTopics = new Set([...topicsData]);
        
        // Add topics from PDF questions that might not be in the original topics list
        pdfQuestions.forEach(q => {
          if (q.topic) {
            allTopics.add(q.topic);
          }
        });

        setTopics(Array.from(allTopics).sort());
        setQuestions(allQuestions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { questions, topics, loading, error };
}
