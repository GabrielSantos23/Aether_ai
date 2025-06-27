// Server-side configuration

// Get the site URL from environment variables or use a default
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://your-production-url.com");

export const config = {
  siteUrl: SITE_URL,
};

export default config;
