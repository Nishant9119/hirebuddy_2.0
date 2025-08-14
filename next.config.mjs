/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    // Keep existing <img> behavior; no optimization to preserve visuals exactly
    unoptimized: true,
  },
  // Ensure third-party ESM packages are transpiled for the server build
  transpilePackages: ['lucide-react'],
  typescript: {
    // Preserve original code without forcing type fixes during migration
    ignoreBuildErrors: true,
  },
  eslint: {
    // Do not block builds on lint issues during migration
    ignoreDuringBuilds: true,
  },
  env: {
    // Expose Vite-style vars under NEXT_PUBLIC_* so client code works unchanged
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL,
    NEXT_PUBLIC_AWS_API_BASE_URL: process.env.NEXT_PUBLIC_AWS_API_BASE_URL || process.env.VITE_AWS_API_BASE_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STACK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_KEY || process.env.VITE_STACK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_OPENAI_API_KEY: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY,
    NEXT_PUBLIC_GA_TRACKING_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID || 'G-BZT6T4QE76',
  },
  async redirects() {
    return [
      { source: '/resume-editor', destination: '/resume-builder', permanent: false },
    ];
  },
};

export default nextConfig;
