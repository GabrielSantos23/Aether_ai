import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["img.clerk.com", "lh3.googleusercontent.com", "avatars.githubusercontent.com"],
  },
  rewrites: async () => {
    return [
      {
        source: "/((?!api/).*)",
        destination: "/shell",
      },
    ];
  },
  env: {
    CONVEX_AUTH_PRIVATE_KEY: process.env.CONVEX_AUTH_PRIVATE_KEY,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    CONVEX_AUTH_ADAPTER_SECRET: process.env.CONVEX_AUTH_ADAPTER_SECRET,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has TypeScript errors.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
