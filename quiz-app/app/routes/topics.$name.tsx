import clsx from 'clsx';
import { type FormEventHandler, useCallback, useEffect, useMemo, useState } from 'react';
import type { LoaderFunctionArgs, MetaFunction } from 'react-router';
import { Form, Link, useLoaderData, useParams } from 'react-router';

import { AnswerOptions } from '~/components/AnswerOptions';
import { Button } from '~/components/Button';
import { TextInput } from '~/components/Input';
import { RichMarkdown } from '~/components/RichMarkdown';
import { getQuestionsByTopic } from '~/lib/qa';
import {
	clearTopicProgress,
	loadTopicProgress,
	saveTopicProgress,
} from '~/lib/storage';

export const loader = async ({ params }: LoaderFunctionArgs) => {
	return getQuestionsByTopic(params.name || '');
};

export const meta: MetaFunction = ({ params }) => {
	return [
		{ title: `Developing Solutions for Microsoft Azure: ${params.name}` },
	];
};

export default function Topic() {
	const loaderQuestions = useLoaderData<typeof loader>();
	const params = useParams();
	const topicName = params.name || '';

	// Load saved progress or use fresh shuffled questions
	const [initialized, setInitialized] = useState(false);
	const [index, setIndex] = useState(0);
	const [questions, setQuestions] = useState(loaderQuestions);

	// Initialize from localStorage on mount
	useEffect(() => {
		const savedProgress = loadTopicProgress(topicName);

		if (savedProgress && savedProgress.questionIds.length > 0) {
			// Rebuild questions array in saved order
			const questionMap = new Map(loaderQuestions.map((q) => [q.id, q]));
			const restoredQuestions = savedProgress.questionIds
				.map((id) => questionMap.get(id))
				.filter((q): q is (typeof loaderQuestions)[0] => q !== undefined);

			// Only restore if we have all questions (data might have changed)
			if (restoredQuestions.length === loaderQuestions.length) {
				setQuestions(restoredQuestions);
				setIndex(savedProgress.index);
			}
		}
		setInitialized(true);
	}, [topicName, loaderQuestions]);

	// Save progress whenever index changes
	useEffect(() => {
		if (!initialized) return;

		if (index < questions.length) {
			saveTopicProgress(
				topicName,
				index,
				questions.map((q) => q.id),
			);
		} else {
			// Quiz completed, clear progress
			clearTopicProgress(topicName);
		}
	}, [index, questions, topicName, initialized]);

	const [checkedValues, setCheckedValues] = useState<number[]>([]);
	const [showAnswer, setShowAnswer] = useState(false);

	// Reset state when question index changes (handles edge cases)
	useEffect(() => {
		setCheckedValues([]);
		setShowAnswer(false);
	}, []);

	const question = index < questions.length ? questions[index] : null;

	// Memoize correct answer check - uses Set for O(1) lookups
	const isCorrectlyAnswered = useMemo(() => {
		const answerIndexes = question?.answerIndexes;
		if (!answerIndexes?.length || answerIndexes.length !== checkedValues.length) {
			return false;
		}
		const checkedSet = new Set(checkedValues);
		return answerIndexes.every((value) => checkedSet.has(value));
	}, [question?.answerIndexes, checkedValues]);

	const buttonColor = showAnswer || isCorrectlyAnswered ? 'green' : 'blue';

	const handleSubmit: FormEventHandler<HTMLFormElement | HTMLButtonElement> = useCallback(
		(e) => {
			e.preventDefault();
			setCheckedValues([]);
			setShowAnswer(false);
			setIndex((idx) => idx + 1);
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return false;
		},
		[],
	);

	const handleRestart = useCallback(() => {
		clearTopicProgress(topicName);
		setIndex(0);
		setQuestions(loaderQuestions); // Use fresh shuffled order from loader
		setCheckedValues([]);
		setShowAnswer(false);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}, [topicName, loaderQuestions]);

	return (
		<Form method="post" onSubmit={handleSubmit}>
			<h2 className="mt-0 text-center">
				<Link to={'/topics'}>← Back to Topics</Link>
			</h2>
			{question ? (
				<>
					<div className="text-2x">
						<span className="font-bold">
							{params.name} ({index + 1} / {questions.length}):{' '}
						</span>
						{index > 0 && (
							<button
								type="button"
								onClick={handleRestart}
								className="ml-2 text-gray-400 text-xs underline hover:text-gray-600"
								title="Start over from the beginning"
							>
								Restart
							</button>
						)}
						<RichMarkdown interactive>{question.question}</RichMarkdown>
					</div>
					{question.options && question.options.length > 0 && (
						<AnswerOptions
							name="answers"
							options={question.options}
							checkedValues={checkedValues}
							setCheckedValues={setCheckedValues}
							showAnswer={showAnswer}
							answerIndexes={question.answerIndexes}
							disabled={showAnswer}
						/>
					)}
					{question.answerIndexes && question.answerIndexes.length > 1 && (
						<div className="text-gray-400 text-xs italic">
							Note: This question has more than one correct answer
						</div>
					)}
					{(!question.options || !question.options.length) &&
						!question.hasCode && <TextInput />}

					<div
						className={clsx(
							'mt-4 overflow-hidden transition-opacity duration-500 ease-in-out',
							showAnswer ? 'h-auto opacity-100' : 'h-0 opacity-0',
						)}
					>
						<div className="font-bold">Answer: </div>
						<RichMarkdown>{question.answer}</RichMarkdown>
					</div>
					<div className="mt-12 flex justify-between">
						<Button
							type="button"
							onClick={() => setShowAnswer((ans) => !ans)}
							bgColor={buttonColor}
						>
							{!showAnswer ? 'Show' : 'Hide'} Answer
						</Button>
						<Button bgColor={buttonColor} type="submit" onSubmit={handleSubmit}>
							Next
						</Button>
					</div>
				</>
			) : (
				<div className="text-center">
					<div className="text-7xl italic">All done! 🎉</div>
					<button
						type="button"
						onClick={handleRestart}
						className="mt-8 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
					>
						Restart Quiz
					</button>
				</div>
			)}
		</Form>
	);
}
