// Test file to verify randomization improvements
import { AlgorithmUtils } from '../leitner/utils';

describe('Leitner Randomization Improvements', () => {
  const sampleQuestionIds = [
    "432139a6157dbd4579692cf8d715f98d2f6ec623499dbab8d67b5efb86acd59a",
    "04363fe5a3cabd750c902fd5844d51c5c5d22d467cea7bd36b9ba94bc131e569", 
    "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "123456789012345678901234567890123456789012345678901234567890abcd",
    "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321"
  ];

  test('stableRandom produces different values with different seeds', () => {
    const questionId = sampleQuestionIds[0];
    const seed1 = 1000;
    const seed2 = 2000;
    
    const random1 = AlgorithmUtils.stableRandom(questionId, seed1);
    const random2 = AlgorithmUtils.stableRandom(questionId, seed2);
    
    expect(random1).not.toBe(random2);
  });

  test('stableRandom produces consistent values with same seed', () => {
    const questionId = sampleQuestionIds[0];
    const seed = 1000;
    
    const random1 = AlgorithmUtils.stableRandom(questionId, seed);
    const random2 = AlgorithmUtils.stableRandom(questionId, seed);
    
    expect(random1).toBe(random2);
  });

  test('different seeds produce meaningfully different sort orders', () => {
    const seeds = [1000, 2000, 3000, 4000, 5000];
    const sortOrders = seeds.map(seed => 
      sampleQuestionIds
        .map(id => ({ id, random: AlgorithmUtils.stableRandom(id, seed) }))
        .sort((a, b) => a.random - b.random)
        .map(item => item.id)
    );

    // Check that at least some of the sort orders are different
    let differentOrders = 0;
    for (let i = 1; i < sortOrders.length; i++) {
      if (JSON.stringify(sortOrders[0]) !== JSON.stringify(sortOrders[i])) {
        differentOrders++;
      }
    }
    
    expect(differentOrders).toBeGreaterThan(2); // At least 3 out of 5 should be different
  });

  test('hash distribution should be more spread out', () => {
    const seed = 1000;
    const randoms = sampleQuestionIds.map(id => AlgorithmUtils.stableRandom(id, seed));
    
    // Check that the range is reasonably spread (not all clustered)
    const min = Math.min(...randoms);
    const max = Math.max(...randoms);
    const range = max - min;
    
    expect(range).toBeGreaterThan(0.5); // Should span at least half the range
  });
});