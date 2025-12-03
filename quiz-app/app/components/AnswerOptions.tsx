import clsx from 'clsx';
import { type ChangeEventHandler, type Dispatch, type FC, memo, type SetStateAction, useCallback, useMemo } from 'react';
import { InputStyle } from '~/components/Input';
import { Markdown } from '~/components/Markdown';

interface AnswerOptionsProps {
	name: string;
	options: string[];
	checkedValues: number[];
	setCheckedValues: Dispatch<SetStateAction<number[]>>;
	showAnswer: boolean;
	answerIndexes: number[];
	disabled?: boolean;
}

export const AnswerOptions: FC<AnswerOptionsProps> = memo(function AnswerOptions({
	name,
	options,
	checkedValues,
	setCheckedValues,
	showAnswer,
	answerIndexes,
	disabled,
}) {
	// Determine input type once
	const inputType = answerIndexes.length < 2 ? 'radio' : 'checkbox';

	// Memoize checked values as Set for O(1) lookups
	const checkedSet = useMemo(() => new Set(checkedValues), [checkedValues]);
	const answerSet = useMemo(() => new Set(answerIndexes), [answerIndexes]);

	const handleChange: ChangeEventHandler<HTMLInputElement> = useCallback(
		(event) => {
			const { checked, value, type } = event.target;
			const index = Number.parseInt(value, 10);

			if (type === 'checkbox') {
				setCheckedValues((prev) =>
					checked ? [...prev, index] : prev.filter((v) => v !== index)
				);
			} else if (type === 'radio' && checked) {
				setCheckedValues([index]);
			}
		},
		[setCheckedValues],
	);

	// Get background color based on answer state
	const getOptionBg = (index: number): string => {
		const isChecked = checkedSet.has(index);
		const isAnswer = answerSet.has(index);
		if ((showAnswer || isChecked) && isAnswer) return 'bg-green-200';
		if (isChecked) return 'bg-red-200';
		return 'bg-transparent';
	};

	return (
		<ul className="list-none p-0">
			{options.map((option: string, index: number) => (
				<li key={`${index}-${option}`} className="mb-2">
					<label className={clsx(InputStyle, getOptionBg(index))}>
						<input
							type={inputType}
							checked={checkedSet.has(index)}
							onChange={handleChange}
							className="hidden"
							value={index}
							name={name}
							disabled={disabled}
						/>
						<Markdown
							components={{
								p({ node, className, children, ...props }) {
									return (
										<p className={clsx(className, 'my-0!')} {...props}>
											{children}
										</p>
									);
								},
							}}
						>
							{option}
						</Markdown>
					</label>
				</li>
			))}
		</ul>
	);
});
