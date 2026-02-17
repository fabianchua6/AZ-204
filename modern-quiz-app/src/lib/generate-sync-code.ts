/**
 * Generate a short, human-readable sync code like "AZ-X7K9M2"
 * Uses only unambiguous characters (no 0/O, 1/I/L)
 */

const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateSyncCode(): string {
    const chars: string[] = [];
    for (let i = 0; i < 6; i++) {
        const randomIndex = Math.floor(Math.random() * CHARSET.length);
        chars.push(CHARSET[randomIndex]);
    }
    return `AZ-${chars.join('')}`;
}

/**
 * Validate that a sync code matches the expected format
 */
export function isValidSyncCode(code: string): boolean {
    return /^AZ-[A-HJ-KM-NP-Z2-9]{6}$/.test(code.toUpperCase());
}
