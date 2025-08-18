export function LoadingSpinner() {
	return (
		<div className="flex items-center justify-center space-x-2">
			<div className="loading-dots">
				<div style={{ '--i': 0 } as React.CSSProperties}></div>
				<div style={{ '--i': 1 } as React.CSSProperties}></div>
				<div style={{ '--i': 2 } as React.CSSProperties}></div>
			</div>
			<span className="text-muted-foreground">Loading questions...</span>
		</div>
	);
}
