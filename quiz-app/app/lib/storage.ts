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
 * Load progress for topic-based quiz
 */
export function loadTopicProgress(topic: string): QuizProgress | null {
	if (typeof window === 'undefined') return null;

	try {
		const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${topic}`);
		if (!data) return null;

		const progress: QuizProgress = JSON.parse(data);

		// Expire progress after 24 hours
		const ONE_DAY = 24 * 60 * 60 * 1000;
		if (Date.now() - progress.timestamp > ONE_DAY) {
			localStorage.removeItem(`${STORAGE_KEY_PREFIX}${topic}`);
			return null;
		}

		return progress;
	} catch {
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
		const answered: AnsweredQuestions = existingData
			? JSON.parse(existingData)
			: {};

		answered[key] = questionIds;

		localStorage.setItem(GLOBAL_ANSWERED_KEY, JSON.stringify(answered));
	} catch {
		console.warn('Failed to save answered questions');
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

		const answered: AnsweredQuestions = JSON.parse(data);
		const key = topic || '_all';

		return answered[key] || [];
	} catch {
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

			const answered: AnsweredQuestions = JSON.parse(data);
			const key = topic || '_all';
			delete answered[key];

			localStorage.setItem(GLOBAL_ANSWERED_KEY, JSON.stringify(answered));
		}
	} catch {
		// Ignore errors
	}
}
