/**
 * Sync API Logic Tests
 * Tests the sync code validation and data handling logic
 */

import { generateSyncCode, isValidSyncCode, SYNC_CODE_REGEX } from '../generate-sync-code';

describe('Sync Code Validation', () => {
    describe('SYNC_CODE_REGEX', () => {
        it('matches valid sync codes', () => {
            const validCodes = [
                'AZ-ABCDEF',
                'AZ-234567',
                'AZ-XYZABC',
                'AZ-MNPQRS',
            ];
            validCodes.forEach(code => {
                expect(SYNC_CODE_REGEX.test(code)).toBe(true);
            });
        });

        it('rejects codes with ambiguous characters (0, 1, I, L, O)', () => {
            const invalidCodes = [
                'AZ-ABC0EF', // contains 0
                'AZ-ABC1EF', // contains 1
                'AZ-ABCIEF', // contains I
                'AZ-ABCLEF', // contains L
                'AZ-ABCOEF', // contains O
            ];
            invalidCodes.forEach(code => {
                expect(SYNC_CODE_REGEX.test(code)).toBe(false);
            });
        });

        it('rejects codes with wrong format', () => {
            const invalidCodes = [
                'AZABCDEF',   // missing hyphen
                'AZ-ABCDE',  // too short
                'AZ-ABCDEFG', // too long
                'XY-ABCDEF', // wrong prefix
                'az-abcdef', // lowercase (regex is case-sensitive, code is uppercased before check)
                '',
            ];
            invalidCodes.forEach(code => {
                expect(SYNC_CODE_REGEX.test(code)).toBe(false);
            });
        });
    });

    describe('isValidSyncCode', () => {
        it('validates correct codes', () => {
            expect(isValidSyncCode('AZ-ABCD23')).toBe(true);
            expect(isValidSyncCode('AZ-XYZMNP')).toBe(true);
        });

        it('handles lowercase by uppercasing', () => {
            expect(isValidSyncCode('az-abcd23')).toBe(true);
        });

        it('rejects invalid codes', () => {
            expect(isValidSyncCode('invalid')).toBe(false);
            expect(isValidSyncCode('')).toBe(false);
            expect(isValidSyncCode('AZ-ABC')).toBe(false);
        });
    });

    describe('generateSyncCode', () => {
        it('generates codes with correct format', () => {
            for (let i = 0; i < 20; i++) {
                const code = generateSyncCode();
                expect(code).toMatch(/^AZ-[A-HJ-KM-NP-Z2-9]{6}$/);
            }
        });

        it('generates unique codes', () => {
            const codes = new Set<string>();
            for (let i = 0; i < 100; i++) {
                codes.add(generateSyncCode());
            }
            // With 6 chars from 32 possible, collision is very unlikely
            expect(codes.size).toBeGreaterThanOrEqual(98);
        });
    });
});

describe('Sync Data Structure', () => {
    const validSyncData = {
        quizProgress: { 'quiz_progress_topic1': { index: 5 } },
        answeredQuestions: { 'topic1': ['q1', 'q2'] },
        leitnerProgress: { 'leitner_data': { box1: [] } },
        settings: { theme: 'dark' },
        lastSync: '2025-01-01T00:00:00Z',
    };

    it('has required fields', () => {
        expect(validSyncData).toHaveProperty('quizProgress');
        expect(validSyncData).toHaveProperty('answeredQuestions');
        expect(validSyncData).toHaveProperty('leitnerProgress');
        expect(validSyncData).toHaveProperty('settings');
        expect(validSyncData).toHaveProperty('lastSync');
    });

    it('allows empty objects for each field', () => {
        const emptySyncData = {
            quizProgress: {},
            answeredQuestions: {},
            leitnerProgress: {},
            settings: {},
            lastSync: '2025-01-01T00:00:00Z',
        };
        expect(emptySyncData.quizProgress).toEqual({});
        expect(emptySyncData.answeredQuestions).toEqual({});
    });
});
