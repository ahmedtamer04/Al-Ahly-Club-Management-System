/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5001/api/:path*',
      },
    ];
  },
  // Optimize compilation
  swcMinify: true,
  // Disable source maps in development for faster builds
  productionBrowserSourceMaps: false,
  // Speed up development
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce compilation time in development
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
}

module.exports = nextConfig
