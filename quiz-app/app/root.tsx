import highlight from 'highlight.js/styles/github.css?url';
import type { LinksFunction } from 'react-router';
import {
	Link,
	Links,
	Meta,
	Outlet,
	Scripts,
	// ScrollRestoration,
} from 'react-router';
import stylesheet from '~/tailwind.css?url';

export const links: LinksFunction = () => [
	{ rel: 'stylesheet', href: stylesheet },
	{ rel: 'stylesheet', href: highlight },
];

export default function App() {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width,initial-scale=1" />
				<link
					rel="apple-touch-icon"
					sizes="180x180"
					href="/apple-touch-icon.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="32x32"
					href="/favicon-32x32.png"
				/>
				<link
					rel="icon"
					type="image/png"
					sizes="16x16"
					href="/favicon-16x16.png"
				/>
				<link rel="manifest" href="/site.webmanifest" />
				<Meta />
				<Links />
			</head>
			<body className="h-screen w-full bg-gray-100 text-gray-700 antialiased">
				<div className="flex h-screen w-full justify-center bg-gray-100 pt-6 text-gray-700 antialiased">
					<div className="flex w-full max-w-3xl flex-col justify-between p-3">
						<main className="prose max-w-3xl grow">
							<h1 className="relative text-center font-bold text-5xl text-indigo-700">
								<Link to="/">AZ-204 Quiz</Link>
								<Link
									to="/settings"
									title="Settings"
									className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 transition-colors hover:text-gray-600"
								>
									<svg
										className="h-6 w-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
									</svg>
								</Link>
							</h1>
							<div className="mt-6 w-full rounded-lg bg-white p-8 shadow-lg">
								<Outlet />
							</div>
							<small className="mt-2 block text-center">
								Exam revision: April 11, 2025
							</small>
						</main>
						<footer className="mt-6 text-center">
							<div className="flex items-center justify-center">
								<a
									href="https://github.com/arvigeus/AZ-204"
									target="_blank"
									title="Viewing existing code on GitHub"
									rel="noreferrer"
								>
									<svg
										role="img"
										aria-label="GitHub"
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										viewBox="0 0 24 24"
									>
										<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
									</svg>
								</a>
							</div>
						</footer>
					</div>
				</div>
				{/* <ScrollRestoration /> */}
				<Scripts />
			</body>
		</html>
	);
}
