/** @type {import('next').NextConfig} */
const nextConfig = {
	trailingSlash: true,
	poweredByHeader: false,
	
	// Performance optimizations
	compress: true,
	swcMinify: true,
	
	// Image optimization
	images: {
		unoptimized: true,
		formats: ['image/webp', 'image/avif'],
		deviceSizes: [640, 768, 1024, 1280, 1600],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},
	
	// Build optimizations
	experimental: {
		// Remove optimizeCss as it's causing critters dependency issues
		optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
	},
	
	// Development settings
	eslint: {
		ignoreDuringBuilds: process.env.NODE_ENV === 'production',
	},
	typescript: {
		ignoreBuildErrors: process.env.NODE_ENV === 'production',
	},
	
	// Headers for security and performance
	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-XSS-Protection',
						value: '1; mode=block',
					},
					{
						key: 'Referrer-Policy',
						value: 'strict-origin-when-cross-origin',
					},
				],
			},
			{
				source: '/api/(.*)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'no-store, must-revalidate',
					},
				],
			},
			{
				source: '/_next/static/(.*)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
		];
	},
};

// Bundle analyzer configuration
if (process.env.ANALYZE === 'true') {
	const withBundleAnalyzer = require('@next/bundle-analyzer')({
		enabled: true,
	});
	module.exports = withBundleAnalyzer(nextConfig);
} else {
	module.exports = nextConfig;
}
