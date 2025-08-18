'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		setTheme(theme === 'light' ? 'dark' : 'light');
	};

	const getThemeIcon = () => {
		return theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
	};

	return (
		<header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="p-2 bg-primary/10 rounded-lg">
							<BookOpen className="h-6 w-6 text-primary" />
						</div>
						<div>
							<h1 className="text-xl font-bold">AZ-204 Quiz App</h1>
							<p className="text-sm text-muted-foreground">
								Azure Developer Associate Practice
							</p>
						</div>
					</div>

					<Button
						variant="ghost"
						size="sm"
						onClick={toggleTheme}
						className="relative"
					>
						{getThemeIcon()}
						<span className="sr-only">Toggle theme</span>
					</Button>
				</div>
			</div>
		</header>
	);
}
