import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  experimental: {
    // This will allow Next.js to attempt better handling of route groups
    serverMinification: false,
    // Enable scrollRestoration in the app router
    scrollRestoration: true,
  },
};

export default nextConfig;
