import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{
						key: 'Content-Security-Policy',
						// This will be overridden by middleware for authenticated requests
						value: "frame-ancestors 'self'",
					},
				],
			},
		];
	},
	images: {
		domains: ['lh3.googleusercontent.com'],
	},
};

export default nextConfig;
