import path from 'path';
import { fileURLToPath } from 'url';
import { imageHosts } from './image-hosts.config.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent Next from picking a parent-folder package-lock as workspace root
  // (that breaks CSS chunk paths and causes page.css 404s).
  outputFileTracingRoot: path.join(__dirname),
  devIndicators: false,
  // Keep false for production IP / reverse-engineering protection.
  // Flip to true only when ops prefer easier prod debugging over obfuscation
  // (see DEBUG_REPORT source-maps decision).
  productionBrowserSourceMaps: false,
  distDir: process.env.DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    // Fail production builds on lint errors (was ignoreDuringBuilds: true — hid ship blockers)
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: imageHosts,
    minimumCacheTTL: 60,
    qualities: [75, 85, 100],
  },
  async headers() {
    return [
      {
        source: '/landing/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/explore', destination: '/dashboard', permanent: true },
      { source: '/explore/:path*', destination: '/dashboard', permanent: true },
    ];
  },
  webpack(config, { dev }) {
    if (dev) {
      const ignoredPaths = (process.env.WATCH_IGNORED_PATHS || '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      config.watchOptions = {
        ignored: ignoredPaths.length
          ? ignoredPaths.map((p) => `**/${p.replace(/^\/+|\/+$/g, '')}/**`)
          : undefined,
      };
    }
    return config;
  },
};
export default nextConfig;
