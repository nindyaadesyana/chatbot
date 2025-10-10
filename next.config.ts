import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'apidev.tvku.tv',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.tvku.tv',
        port: '',
        pathname: '/**',
      },
    ],
    domains: ['apidev.tvku.tv', 'storage.tvku.tv'],
  },
};

export default nextConfig;
