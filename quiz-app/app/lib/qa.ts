import { data } from '~/db';
import type { QAPair } from '~/types/QAPair';

export { topics } from '~/db';
export { data };

export type Question = QAPair & { index: number };

// Pre-compute lookup maps for O(1) access
const dataByIdMap = new Map(
	data.map((q, i) => [q.id, { question: q, index: i }]),
);
const dataByTopicMap = new Map<string, QAPair[]>();
for (const q of data) {
	const existing = dataByTopicMap.get(q.topic) || [];
	existing.push(q);
	dataByTopicMap.set(q.topic, existing);
}

export const getQA = (
	topic?: string | null | undefined,
	answeredIndexes?: Set<number> | null | undefined,
): Question | null => {
	// Use pre-computed map for O(1) topic lookup
	let questions: QAPair[] = topic ? dataByTopicMap.get(topic) || [] : data;

	if (questions.length === 0) return null;

	if (answeredIndexes?.size) {
		const answeredIds = new Set<string>();
		for (const i of answeredIndexes)
			if (i >= 0 && i < data.length && data[i]) answeredIds.add(data[i].id);

		if (topic) {
			const availableIds = new Set(questions.map((q) => q.id));
			for (const key of answeredIds.keys())
				if (!availableIds.has(key)) answeredIds.delete(key);
		}

		const answers = Array.from(answeredIds);

		const chances = convertToChances(
			answers,
			answers.length === questions.length,
		);

		const filtered = questions.filter(
			(item) => !chances[item.id] || Math.random() > chances[item.id],
		);

		if (filtered.length > 0) questions = filtered;
	}

	const question = getRandomElement<QAPair>(questions);
	const index = data.findIndex((item) => item.id === question.id);

	return shuffleQA({ ...question, index });
};

export const getQAById = (id: string): Question | null => {
	const entry = dataByIdMap.get(id);
	if (!entry) return null;
	return shuffleQA({ ...entry.question, index: entry.index });
};

export const getQuestionsByTopic = (topic: string): QAPair[] => {
	const questions = dataByTopicMap.get(topic);
	if (!questions?.length) return [];
	return shuffleArray(questions);
};

const getRandomElement = <T>(array: T[]): T =>
	array[Math.floor(Math.random() * array.length)];

function shuffleQA(question: Question): Question {
	if (!question.options.length) return question;

	// Create an array of indices and shuffle them
	const indices = question.options.map((_, i) => i);
	const shuffledIndices = shuffleArray(indices);

	// Map options using shuffled indices
	const options = shuffledIndices.map((i) => question.options[i]);

	// Map answer indices to their new positions
	const answerIndexes = question.answerIndexes.map((originalIndex) =>
		shuffledIndices.indexOf(originalIndex),
	);

	return {
		...question,
		options,
		answerIndexes,
	};
}

function shuffleArray<T>(arr: T[]): T[] {
	const arrayCopy = [...arr];
	for (let i = arrayCopy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arrayCopy[i], arrayCopy[j]] = [arrayCopy[j] as T, arrayCopy[i] as T];
	}
	return arrayCopy;
}

function convertToChances(
	arr: string[],
	startFromZero?: boolean,
): { [key: string]: number } {
	const chances: { [key: string]: number } = {};

	if (arr.length === 0) return chances;

	const step =
		startFromZero && arr.length > 1 ? 1 / (arr.length - 1) : 1 / arr.length;

	chances[arr[0]] = startFromZero ? 0 : step;
	const multiplier = startFromZero ? 0 : 1;
	for (let i = 1; i < arr.length; i++) {
		chances[arr[i]] = (i + multiplier) * step;
	}
	return chances;
}
