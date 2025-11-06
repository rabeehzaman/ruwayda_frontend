import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Production optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Disable development indicators in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Disable telemetry (handled by environment variable NEXT_TELEMETRY_DISABLED=1)
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  disable: true, // Disable PWA entirely for now
  workboxOptions: {
    disableDevLogs: true,
  },
})(nextConfig);
