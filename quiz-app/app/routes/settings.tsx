import { useCallback, useEffect, useState } from 'react';
import type { MetaFunction } from 'react-router';
import { Link } from 'react-router';

import { Button } from '~/components/Button';
import { topics } from '~/lib/qa';
import {
	clearAnsweredQuestions,
	clearTopicProgress,
	loadAnsweredQuestions,
	loadTopicProgress,
} from '~/lib/storage';

export const meta: MetaFunction = () => {
	return [{ title: 'Settings & Progress | AZ-204 Quiz' }];
};

interface TopicProgress {
	topic: string;
	currentIndex: number;
	totalQuestions: number;
	percentage: number;
}

interface RandomProgress {
	topic: string | null;
	label: string;
	answeredCount: number;
}

export default function Settings() {
	const [topicProgress, setTopicProgress] = useState<TopicProgress[]>([]);
	const [randomProgress, setRandomProgress] = useState<RandomProgress[]>([]);
	const [cleared, setCleared] = useState<string | null>(null);

	// Load progress data on mount
	const loadProgress = useCallback(() => {
		// Load topic-based progress
		const topicData: TopicProgress[] = [];
		for (const topic of topics) {
			const progress = loadTopicProgress(topic);
			if (progress && progress.questionIds.length > 0) {
				topicData.push({
					topic,
					currentIndex: progress.index,
					totalQuestions: progress.questionIds.length,
					percentage: Math.round(
						(progress.index / progress.questionIds.length) * 100,
					),
				});
			}
		}
		setTopicProgress(topicData);

		// Load random quiz progress
		const randomData: RandomProgress[] = [];

		// Check global (all topics) progress
		const globalAnswered = loadAnsweredQuestions(null);
		if (globalAnswered.length > 0) {
			randomData.push({
				topic: null,
				label: 'All Topics',
				answeredCount: globalAnswered.length,
			});
		}

		// Check per-topic random progress
		for (const topic of topics) {
			const answered = loadAnsweredQuestions(topic);
			if (answered.length > 0) {
				randomData.push({
					topic,
					label: topic,
					answeredCount: answered.length,
				});
			}
		}
		setRandomProgress(randomData);
	}, []);

	useEffect(() => {
		loadProgress();
	}, [loadProgress]);

	const handleClearTopicProgress = useCallback(
		(topic: string) => {
			clearTopicProgress(topic);
			setCleared(`Cleared progress for "${topic}"`);
			loadProgress();
			setTimeout(() => setCleared(null), 3000);
		},
		[loadProgress],
	);

	const handleClearRandomProgress = useCallback(
		(topic: string | null) => {
			clearAnsweredQuestions(topic);
			const label = topic || 'All Topics';
			setCleared(`Cleared random quiz history for "${label}"`);
			loadProgress();
			setTimeout(() => setCleared(null), 3000);
		},
		[loadProgress],
	);

	const handleClearAll = useCallback(() => {
		// Clear all topic progress
		for (const topic of topics) {
			clearTopicProgress(topic);
		}
		// Clear all random quiz progress
		clearAnsweredQuestions();
		setCleared('Cleared all quiz data');
		loadProgress();
		setTimeout(() => setCleared(null), 3000);
	}, [loadProgress]);

	const hasAnyProgress = topicProgress.length > 0 || randomProgress.length > 0;

	return (
		<div className="mx-auto max-w-2xl">
			{/* Header */}
			<div className="mb-8 text-center">
				<h1 className="mb-2 font-bold text-3xl text-gray-900">Settings</h1>
				<p className="text-gray-600">
					Manage your quiz progress and preferences
				</p>
				<Link
					to="/"
					className="mt-4 inline-block text-blue-600 hover:text-blue-800 hover:underline"
				>
					← Back to Quiz
				</Link>
			</div>

			{/* Success Toast */}
			{cleared && (
				<div className="mb-6 rounded-lg border border-green-300 bg-green-100 px-4 py-3 text-green-800">
					<div className="flex items-center gap-2">
						<svg
							className="h-5 w-5"
							fill="currentColor"
							viewBox="0 0 20 20"
							role="img"
							aria-label="Success"
						>
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clipRule="evenodd"
							/>
						</svg>
						<span>{cleared}</span>
					</div>
				</div>
			)}

			{/* Topic Quiz Progress Section */}
			<section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800 text-xl">
					<svg
						className="h-5 w-5 text-blue-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						role="img"
						aria-label="Topic Quiz"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
						/>
					</svg>
					Topic Quiz Progress
				</h2>
				<p className="mb-4 text-gray-600 text-sm">
					Progress saved when going through a specific topic sequentially.
				</p>

				{topicProgress.length > 0 ? (
					<ul className="divide-y divide-gray-100">
						{topicProgress.map((item) => (
							<li
								key={item.topic}
								className="flex items-center justify-between py-3"
							>
								<div className="flex-1">
									<div className="font-medium text-gray-900">{item.topic}</div>
									<div className="mt-1 flex items-center gap-3">
										<div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
											<div
												className="h-full rounded-full bg-blue-600 transition-all"
												style={{ width: `${item.percentage}%` }}
											/>
										</div>
										<span className="text-gray-500 text-sm">
											{item.currentIndex} / {item.totalQuestions} (
											{item.percentage}%)
										</span>
									</div>
								</div>
								<button
									type="button"
									onClick={() => handleClearTopicProgress(item.topic)}
									className="ml-4 rounded-md px-3 py-1.5 text-red-600 text-sm transition-colors hover:bg-red-50 hover:text-red-700"
								>
									Clear
								</button>
							</li>
						))}
					</ul>
				) : (
					<p className="text-gray-500 italic">No topic progress saved.</p>
				)}
			</section>

			{/* Random Quiz History Section */}
			<section className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800 text-xl">
					<svg
						className="h-5 w-5 text-purple-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						role="img"
						aria-label="Random Quiz History"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					Random Quiz History
				</h2>
				<p className="mb-4 text-gray-600 text-sm">
					Questions you've seen in random quiz mode. Clearing this will reset
					the algorithm that avoids showing repeated questions.
				</p>

				{randomProgress.length > 0 ? (
					<ul className="divide-y divide-gray-100">
						{randomProgress.map((item) => (
							<li
								key={item.label}
								className="flex items-center justify-between py-3"
							>
								<div>
									<div className="font-medium text-gray-900">{item.label}</div>
									<div className="text-gray-500 text-sm">
										{item.answeredCount} question
										{item.answeredCount !== 1 ? 's' : ''} seen
									</div>
								</div>
								<button
									type="button"
									onClick={() => handleClearRandomProgress(item.topic)}
									className="ml-4 rounded-md px-3 py-1.5 text-red-600 text-sm transition-colors hover:bg-red-50 hover:text-red-700"
								>
									Clear
								</button>
							</li>
						))}
					</ul>
				) : (
					<p className="text-gray-500 italic">No random quiz history saved.</p>
				)}
			</section>

			{/* Danger Zone */}
			<section className="rounded-lg border border-red-200 bg-red-50 p-6">
				<h2 className="mb-4 flex items-center gap-2 font-semibold text-red-800 text-xl">
					<svg
						className="h-5 w-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						role="img"
						aria-label="Warning"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
					Danger Zone
				</h2>
				<p className="mb-4 text-red-700 text-sm">
					This will permanently delete all your quiz progress and history. This
					action cannot be undone.
				</p>
				<Button
					type="button"
					bgColor="blue"
					onClick={handleClearAll}
					disabled={!hasAnyProgress}
					className={
						!hasAnyProgress
							? '!bg-gray-400 !border-gray-400 cursor-not-allowed opacity-50'
							: '!bg-red-600 !border-red-700 hover:!bg-red-700'
					}
				>
					Clear All Quiz Data
				</Button>
			</section>

			{/* Storage Info */}
			<section className="mt-8 rounded-lg border border-gray-200 bg-gray-50 p-4">
				<h3 className="mb-2 font-medium text-gray-700 text-sm">
					About Storage
				</h3>
				<p className="text-gray-500 text-xs">
					Your quiz progress is stored locally in your browser using
					localStorage. This data never leaves your device and is not synced
					across browsers or devices. Topic progress expires automatically after
					24 hours of inactivity.
				</p>
			</section>
		</div>
	);
}
