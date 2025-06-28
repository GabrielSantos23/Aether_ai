import { ConvexAdapter } from "@/app/ConvexAdapter";
import { SignJWT, importPKCS8 } from "jose";
import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import Notion from "next-auth/providers/notion";

// --- 1. ADD GOOGLE PROVIDER IMPORT ---
import Google from "next-auth/providers/google";

if (process.env.CONVEX_AUTH_PRIVATE_KEY === undefined) {
  throw new Error(
    "Missing CONVEX_AUTH_PRIVATE_KEY Next.js environment variable",
  );
}

if (process.env.NEXT_PUBLIC_CONVEX_URL === undefined) {
  throw new Error(
    "Missing NEXT_PUBLIC_CONVEX_URL Next.js environment variable",
  );
}

// Ensure you have these in your .env.local file
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google Client ID or Secret");
}

// Ensure Notion env vars exist
if (!process.env.NOTION_CLIENT_ID || !process.env.NOTION_CLIENT_SECRET) {
  throw new Error("Missing Notion Client ID or Secret");
}

// Ensure GitHub env vars exist
if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  throw new Error("Missing GitHub Client ID or Secret");
}

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL!.replace(
  /.cloud$/,
  ".site",
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          // Minimal scopes for login. Additional scopes can be requested later via signIn("github", { scope: "repo" })
          scope: "read:user user:email",
        },
      },
    }),
    Resend({
      name: "email",
      from: "My App <onboarding@resend.dev>",
    }),
    // --- 2. ADD AND CONFIGURE GOOGLE PROVIDER ---
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent", // Important for re-asking for permissions
          access_type: "offline",
          response_type: "code",
           // Define the initial, basic scopes for login
          scope: "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
        },
      },
    }),
    // --- NOTION PROVIDER ---
    Notion({
      clientId: process.env.NOTION_CLIENT_ID,
      clientSecret: process.env.NOTION_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "databases:read databases:write pages:read pages:write blocks:read blocks:write users:read",
        },
      },
      redirectUri: `${process.env.NEXTAUTH_URL}/api/auth/callback/notion`,
    } as any),
  ],
  // Cast to `any` to sidestep type incompatibility between duplicated @auth/core versions.
  adapter: ConvexAdapter as any,
  callbacks: {
    // Allow sign-in / linking without extra checks
    async signIn({ user, account }) {
      // When the authenticated provider is the same one already linked, we still
      // want to update stored access/refresh tokens and scopes. Auth.js does
      // not call `linkAccount` in this situation, so we do it manually.
      if (user && account && (ConvexAdapter as any).linkAccount) {
        try {
          await (ConvexAdapter as any).linkAccount({
            ...account,
            userId: (user as any).id,
          });
        } catch (err) {
          console.error("Failed to upsert OAuth account", err);
        }
      }
      return true;
    },

    async session({ session, token }) {
      // Obtain Convex user id from JWT token if present, else existing session
      const userId = (token?.sub as string | undefined) ?? (session.user as any)?.id;

      // Attach id to session
      (session.user as any).id = userId;
      (session as any).userId = userId;

      const privateKey = await importPKCS8(
        process.env.CONVEX_AUTH_PRIVATE_KEY!,
        "RS256",
      );
      const convexToken = await new SignJWT({
        sub: userId,
        email: session.user?.email,
        name: session.user?.name,
        picture: session.user?.image,
      })
        .setProtectedHeader({ alg: "RS256" })
        .setIssuedAt()
        .setIssuer(CONVEX_SITE_URL)
        .setAudience("convex")
        .setExpirationTime("1h")
        .sign(privateKey);

      return { ...session, userId, convexToken };
    },
  },
});

declare module "next-auth" {
  interface Session {
    convexToken: string;
    userId: string;
  }
}