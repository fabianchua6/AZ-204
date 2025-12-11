/**
 * Quiz progress persistence using localStorage
 * Handles saving/loading quiz state for session resumption
 */

const STORAGE_KEY_PREFIX = 'quiz_progress_';
const GLOBAL_ANSWERED_KEY = 'quiz_answered_global';

interface QuizProgress {
	index: number;
	questionIds: string[]; // Store the shuffled order
	timestamp: number;
}

interface AnsweredQuestions {
	[topic: string]: string[]; // topic -> array of question IDs
}

/**
 * Save progress for topic-based quiz (topics.$name route)
 */
export function saveTopicProgress(
	topic: string,
	index: number,
	questionIds: string[],
): void {
	if (typeof window === 'undefined') return;

	const progress: QuizProgress = {
		index,
		questionIds,
		timestamp: Date.now(),
	};

	try {
		localStorage.setItem(
			`${STORAGE_KEY_PREFIX}${topic}`,
			JSON.stringify(progress),
		);
	} catch {
		// localStorage might be full or disabled
		console.warn('Failed to save quiz progress');
	}
}

/**
 * Type guard to validate QuizProgress data
 */
function isQuizProgress(obj: unknown): obj is QuizProgress {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'index' in obj &&
		'questionIds' in obj &&
		'timestamp' in obj &&
		typeof obj.index === 'number' &&
		Array.isArray(obj.questionIds) &&
		obj.questionIds.every((id) => typeof id === 'string') &&
		typeof obj.timestamp === 'number'
	);
}

/**
 * Type guard to validate AnsweredQuestions data
 */
function isAnsweredQuestions(obj: unknown): obj is AnsweredQuestions {
	if (typeof obj !== 'object' || obj === null) return false;

	for (const value of Object.values(obj)) {
		if (!Array.isArray(value)) return false;
		if (!value.every((id) => typeof id === 'string')) return false;
	}

	return true;
}

/**
 * Load progress for topic-based quiz
 */
export function loadTopicProgress(topic: string): QuizProgress | null {
	if (typeof window === 'undefined') return null;

	try {
		const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${topic}`);
		if (!data) return null;

		const parsed = JSON.parse(data);

		// Validate the data structure
		if (!isQuizProgress(parsed)) {
			console.warn('Invalid quiz progress data, clearing...');
			localStorage.removeItem(`${STORAGE_KEY_PREFIX}${topic}`);
			return null;
		}

		// Expire progress after 24 hours
		const ONE_DAY = 24 * 60 * 60 * 1000;
		if (Date.now() - parsed.timestamp > ONE_DAY) {
			localStorage.removeItem(`${STORAGE_KEY_PREFIX}${topic}`);
			return null;
		}

		return parsed;
	} catch (error) {
		console.error('Error loading topic progress:', error);
		// Clear potentially corrupted data
		try {
			localStorage.removeItem(`${STORAGE_KEY_PREFIX}${topic}`);
		} catch {}
		return null;
	}
}

/**
 * Clear progress for a topic (when quiz is completed)
 */
export function clearTopicProgress(topic: string): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.removeItem(`${STORAGE_KEY_PREFIX}${topic}`);
	} catch {
		// Ignore errors
	}
}

/**
 * Save answered question IDs for the random quiz mode
 */
export function saveAnsweredQuestions(
	topic: string | null,
	questionIds: string[],
): void {
	if (typeof window === 'undefined') return;

	try {
		const key = topic || '_all';
		const existingData = localStorage.getItem(GLOBAL_ANSWERED_KEY);
		let answered: AnsweredQuestions = {};

		if (existingData) {
			const parsed = JSON.parse(existingData);
			// Validate existing data before using it
			if (isAnsweredQuestions(parsed)) {
				answered = parsed;
			} else {
				console.warn('Invalid answered questions data, resetting...');
			}
		}

		answered[key] = questionIds;

		localStorage.setItem(GLOBAL_ANSWERED_KEY, JSON.stringify(answered));
	} catch (error) {
		console.warn('Failed to save answered questions:', error);
	}
}

/**
 * Load answered question IDs for random quiz mode
 */
export function loadAnsweredQuestions(topic: string | null): string[] {
	if (typeof window === 'undefined') return [];

	try {
		const data = localStorage.getItem(GLOBAL_ANSWERED_KEY);
		if (!data) return [];

		const parsed = JSON.parse(data);

		// Validate the data structure
		if (!isAnsweredQuestions(parsed)) {
			console.warn('Invalid answered questions data, clearing...');
			localStorage.removeItem(GLOBAL_ANSWERED_KEY);
			return [];
		}

		const key = topic || '_all';
		return parsed[key] || [];
	} catch (error) {
		console.error('Error loading answered questions:', error);
		// Clear potentially corrupted data
		try {
			localStorage.removeItem(GLOBAL_ANSWERED_KEY);
		} catch {}
		return [];
	}
}

/**
 * Clear answered questions (for starting fresh)
 */
export function clearAnsweredQuestions(topic?: string | null): void {
	if (typeof window === 'undefined') return;

	try {
		if (topic === undefined) {
			// Clear all
			localStorage.removeItem(GLOBAL_ANSWERED_KEY);
		} else {
			const data = localStorage.getItem(GLOBAL_ANSWERED_KEY);
			if (!data) return;

			const parsed = JSON.parse(data);

			// Validate data before modifying
			if (!isAnsweredQuestions(parsed)) {
				console.warn('Invalid data, clearing all answered questions');
				localStorage.removeItem(GLOBAL_ANSWERED_KEY);
				return;
			}

			const key = topic || '_all';
			delete parsed[key];

			localStorage.setItem(GLOBAL_ANSWERED_KEY, JSON.stringify(parsed));
		}
	} catch (error) {
		console.warn('Error clearing answered questions:', error);
	}
}
