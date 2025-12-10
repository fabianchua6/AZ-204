// Test file to verify question selection improvements
import { LeitnerSystem } from '../leitner';
import type { Question } from '@/types/quiz';

// Mock questions for testing
const createMockQuestion = (id: string, topic: string = 'Test Topic'): Question => ({
  id,
  question: `Test question ${id}`,
  answer: 'Test answer',
  options: ['Option A', 'Option B', 'Option C'],
  answerIndexes: [0],
  hasCode: false,
  topic,
});

const createMockQuestions = (count: number): Question[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockQuestion(`question-${i.toString().padStart(3, '0')}`, `Topic ${i % 5}`)
  );
};

describe('Leitner Question Selection Improvements', () => {
  let leitnerSystem: LeitnerSystem;
  let mockQuestions: Question[];

  beforeEach(async () => {
    // Create a fresh Leitner system for each test
    leitnerSystem = new LeitnerSystem();
    await leitnerSystem.ensureInitialized();
    
    // Clear any existing progress
    leitnerSystem.clearProgress();
    
    // Create mock questions
    mockQuestions = createMockQuestions(100);
  });

  test('getDueQuestions returns different orders with seed rotation', async () => {
    // Get due questions multiple times to trigger seed rotation
    const order1 = await leitnerSystem.getDueQuestions(mockQuestions);
    
    // Force refresh to get new order
    leitnerSystem.refreshQuestionOrder();
    const order2 = await leitnerSystem.getDueQuestions(mockQuestions);
    
    // The orders should be different (at least some questions in different positions)
    const differentPositions = order1.filter((q, index) => 
      index < order2.length && order2[index].id !== q.id
    ).length;
    
    expect(differentPositions).toBeGreaterThan(5); // At least 5 questions in different positions
  });

  test('includes questions from different boxes for variety', async () => {
    // Set up some questions in different boxes by processing answers
    for (let i = 0; i < 20; i++) {
      // Put some questions in box 2
      leitnerSystem.processAnswer(mockQuestions[i].id, true);
    }
    
    for (let i = 20; i < 30; i++) {
      // Put some questions in box 3 (answer correctly twice)
      leitnerSystem.processAnswer(mockQuestions[i].id, true);
      leitnerSystem.processAnswer(mockQuestions[i].id, true);
    }

    // Get due questions
    const dueQuestions = await leitnerSystem.getDueQuestions(mockQuestions);
    
    // Should include questions from multiple boxes
    const boxCounts = dueQuestions.reduce((acc, q) => {
      acc[q.currentBox] = (acc[q.currentBox] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Should have questions from box 1 (new questions)
    expect(boxCounts[1]).toBeGreaterThan(0);
    
    // Should have at least 20 questions total (MIN_DUE_QUESTIONS)
    expect(dueQuestions.length).toBeGreaterThanOrEqual(20);
  });

  test('includes box 3 questions for review with increased probability', async () => {
    // Create a scenario where we have enough naturally due questions 
    // so the system doesn't need to add extras to meet the minimum
    
    // Create 25 questions in box 1 (more than MIN_DUE_QUESTIONS = 20)
    const testQuestions = mockQuestions.slice(0, 40);
    
    // Leave first 25 in box 1 (naturally due)
    // Put some in box 3
    for (let i = 25; i < 35; i++) {
      leitnerSystem.processAnswer(testQuestions[i].id, true);
      leitnerSystem.processAnswer(testQuestions[i].id, true);
    }

    // Since we have 25 naturally due questions (> 20 minimum), 
    // box 3 questions should only be included based on probability
    let box3Inclusions = 0;
    const trials = 50;
    
    for (let trial = 0; trial < trials; trial++) {
      const dueQuestions = await leitnerSystem.getDueQuestions(testQuestions);
      const box3Count = dueQuestions.filter(q => q.currentBox === 3).length;
      if (box3Count > 0) box3Inclusions++;
    }
    
    // Should not include box 3 questions in every single trial
    const inclusionRate = box3Inclusions / trials;
    expect(inclusionRate).toBeLessThan(1.0); // Not in 100% of trials
    
    // But should include them sometimes due to the 25% probability
    expect(inclusionRate).toBeGreaterThan(0.05); // At least 5% of trials
  });

  test('topic interleaving distributes questions evenly', async () => {
    // Create questions with distinct topics
    const topicQuestions = [
      ...Array.from({ length: 10 }, (_, i) => createMockQuestion(`topic-a-${i}`, 'Topic A')),
      ...Array.from({ length: 10 }, (_, i) => createMockQuestion(`topic-b-${i}`, 'Topic B')),
      ...Array.from({ length: 10 }, (_, i) => createMockQuestion(`topic-c-${i}`, 'Topic C')),
    ];

    const dueQuestions = await leitnerSystem.getDueQuestions(topicQuestions);
    
    // Check that topics are reasonably interleaved (not all questions from one topic at the start)
    const firstTenTopics = dueQuestions.slice(0, 10).map(q => q.topic);
    const uniqueTopicsInFirst10 = new Set(firstTenTopics).size;
    
    // Should have questions from multiple topics in the first 10
    expect(uniqueTopicsInFirst10).toBeGreaterThan(1);
  });

  test('prioritizes questions with more failures', async () => {
    // Set up questions with different failure counts
    const questionA = mockQuestions[0];
    const questionB = mockQuestions[1];
    
    // Make questionA fail more often
    leitnerSystem.processAnswer(questionA.id, false); // Wrong - goes to box 1
    leitnerSystem.processAnswer(questionA.id, false); // Wrong again
    leitnerSystem.processAnswer(questionA.id, false); // Wrong again
    
    // Make questionB fail less
    leitnerSystem.processAnswer(questionB.id, false); // Wrong - goes to box 1
    
    const dueQuestions = await leitnerSystem.getDueQuestions([questionA, questionB]);
    
    // questionA should appear before questionB due to higher failure count
    const indexA = dueQuestions.findIndex(q => q.id === questionA.id);
    const indexB = dueQuestions.findIndex(q => q.id === questionB.id);
    
    expect(indexA).toBeLessThan(indexB);
  });

  test('refreshQuestionOrder changes randomization seed', async () => {
    // Use more questions to ensure meaningful differences
    const testQuestions = mockQuestions.slice(0, 30);
    const order1 = await leitnerSystem.getDueQuestions(testQuestions);
    
    // Add a small delay to ensure different timestamp, then force refresh
    await new Promise(resolve => setTimeout(resolve, 5));
    leitnerSystem.refreshQuestionOrder();
    
    const order2 = await leitnerSystem.getDueQuestions(testQuestions);
    
    // Count how many questions are in different positions
    const minLength = Math.min(order1.length, order2.length);
    let differentPositions = 0;
    
    for (let i = 0; i < minLength; i++) {
      if (order1[i].id !== order2[i].id) {
        differentPositions++;
      }
    }
    
    // At least some questions should be in different positions (more lenient test)
    expect(differentPositions).toBeGreaterThan(0);
    
    // Also test that orders are not identical
    const sameOrder = order1.length === order2.length && 
      order1.every((q, index) => order2[index].id === q.id);
    expect(sameOrder).toBe(false);
  });
});