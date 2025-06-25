import { SignJWT, importPKCS8 } from "jose";
import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Twitter from "next-auth/providers/twitter";
import Notion from "next-auth/providers/notion";
import { cache } from "react";

if (process.env.CONVEX_AUTH_PRIVATE_KEY === undefined) {
  throw new Error(
    "Missing CONVEX_AUTH_PRIVATE_KEY Next.js environment variable"
  );
}

if (process.env.NEXT_PUBLIC_CONVEX_URL === undefined) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL Next.js environment variable"
  );
}

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL!.replace(
  /.cloud$/,
  ".site"
);

// Log the current NEXTAUTH_URL for debugging
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

// Define session interface
interface ExtendedSession extends DefaultSession {
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  convexToken?: string;
  accessToken?: string;
  refreshToken?: string;
}

// Create the NextAuth configuration
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/",
  },
  providers: [
    // Only include providers that have their environment variables set
    ...("AUTH_GITHUB_ID" in process.env && "AUTH_GITHUB_SECRET" in process.env
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...("AUTH_GOOGLE_ID" in process.env && "AUTH_GOOGLE_SECRET" in process.env
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            allowDangerousEmailAccountLinking: true,
            authorization: {
              params: {
                scope:
                  "openid email profile https://www.googleapis.com/auth/drive.readonly",
                prompt: "consent",
                access_type: "offline",
              },
            },
          }),
        ]
      : []),
    ...("AUTH_DISCORD_ID" in process.env && "AUTH_DISCORD_SECRET" in process.env
      ? [
          Discord({
            clientId: process.env.AUTH_DISCORD_ID!,
            clientSecret: process.env.AUTH_DISCORD_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...("AUTH_TWITTER_ID" in process.env && "AUTH_TWITTER_SECRET" in process.env
      ? [
          Twitter({
            clientId: process.env.AUTH_TWITTER_ID!,
            clientSecret: process.env.AUTH_TWITTER_SECRET!,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    ...("AUTH_NOTION_ID" in process.env && "AUTH_NOTION_SECRET" in process.env
      ? [
          Notion({
            clientId: process.env.AUTH_NOTION_ID!,
            clientSecret: process.env.AUTH_NOTION_SECRET!,
            redirectUri: `${process.env.APP_URL}/api/auth/callback/notion`,
          }),
        ]
      : []),
  ],
  // Use JWT strategy only - don't use the Convex adapter here to avoid bundling issues
  // We'll handle the Convex integration through the JWT token
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // Attach a JWT for authenticating with Convex
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: JWT;
    }) {
      if (token?.sub) {
        // Add the user ID to the session
        if (session.user) {
          session.user.id = token.sub;
        }
      }

      // Add access token and refresh token to session if available
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken as string;
      }

      // Only add the convex token if we have the necessary environment variables
      if (process.env.CONVEX_AUTH_PRIVATE_KEY) {
        try {
          const privateKey = await importPKCS8(
            process.env.CONVEX_AUTH_PRIVATE_KEY!,
            "RS256"
          );

          // Create a payload with all the user information we want to pass to Convex
          const payload = {
            sub: session.user?.id || "",
            name: session.user?.name || "",
            email: session.user?.email || "",
            image: session.user?.image || "",
            // Ensure we use a consistent format for the tokenIdentifier
            tokenIdentifier: session.user?.id || "",
          };

          const convexToken = await new SignJWT(payload)
            .setProtectedHeader({ alg: "RS256" })
            .setIssuedAt()
            .setIssuer(CONVEX_SITE_URL)
            .setAudience("convex")
            .setExpirationTime("1h")
            .sign(privateKey);

          return { ...session, convexToken };
        } catch (error) {
          console.error("Error creating convex token:", error);
          return session;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }

      // Save the access token and refresh token when available
      if (account && account.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      return token;
    },
  },
  debug: false, // Disable debug logs
};

// Create the NextAuth handler with the configuration
const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

// Export the cached auth function for server components
const authFn = cache(auth);

// Export everything for use in the app
export { authFn as auth, handlers, signIn, signOut };

// Type declarations for NextAuth
declare module "next-auth" {
  interface Session {
    convexToken?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
