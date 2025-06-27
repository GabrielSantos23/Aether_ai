import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import Twitter from "next-auth/providers/twitter";
import Notion from "next-auth/providers/notion";
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api";

// Initialize Convex HTTP client for server-side operations
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Log the current NEXTAUTH_URL for debugging
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

// Configure Google provider without hardcoding scopes
const googleProvider = Google({
  clientId: process.env.AUTH_GOOGLE_ID!,
  clientSecret: process.env.AUTH_GOOGLE_SECRET!,
  allowDangerousEmailAccountLinking: true,
});

const providers = [
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
    ? [googleProvider]
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
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/",
  },
  providers,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, user, profile }) {
      console.log("JWT Callback - Input:", {
        hasToken: !!token,
        hasAccount: !!account,
        hasUser: !!user,
        hasProfile: !!profile,
        tokenScopeBefore: token.scope, // Added for debugging
      });

      // If a new account is being linked, or on a new sign-in
      if (account) {
        console.log("JWT Callback - Account Details:", {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          accountScope: account.scope, // Renamed for clarity
          expiresAt: account.expires_at,
        });

        // Persist the new access and refresh tokens
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at
          ? Date.now() + account.expires_at * 1000
          : undefined;
        // Concatenate new scopes with existing ones, avoiding duplicates
        const newScopes = account.scope?.split(" ") || [];
        const existingScopes = ((token.scope as string) || "").split(" ");
        token.scope = Array.from(
          new Set([...existingScopes, ...newScopes])
        ).join(" ");
      }

      console.log("JWT Callback - Output Token:", {
        sub: token.sub,
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        tokenScopeAfter: token.scope, // Added for debugging
      });

      return token;
    },

    async session({ session, token }) {
      console.log("Session Callback - Input:", {
        hasSession: !!session,
        hasToken: !!token,
        tokenSub: token.sub,
        tokenScope: token.scope, // Added for debugging
      });

      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      // Copy token data to session
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.scope = token.scope as string;

      console.log("Session Callback - Output:", {
        userId: session.user?.id,
        hasAccessToken: !!session.accessToken,
        hasRefreshToken: !!session.refreshToken,
        sessionScope: session.scope, // Renamed for clarity
      });

      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      // This event fires on any sign-in or re-authentication
      // `account` has the most recent scope and tokens from the provider
      if (!account || !account.providerAccountId || !account.scope) {
        console.log("signIn event: Missing account data");
        return;
      }

      try {
        console.log("signIn event: Processing for provider", account.provider);

        if (account.provider === "google") {
          // Try-catch to handle potential API errors before we have the functions
          try {
            // Find the user in Convex by their Google account ID
            const convexUser = await convex.query(
              api.users.getUserByProviderAccountId,
              {
                providerAccountId: account.providerAccountId,
              }
            );

            if (convexUser) {
              // If the user exists, update their record with the new scopes/tokens
              console.log("signIn event: Found user, updating scopes.");
              await convex.mutation(api.users.updateUserOAuth, {
                userId: convexUser._id,
                scopes: account.scope,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
              });
            } else if (user.email) {
              // If we couldn't find by provider ID but have email, try to create/update by email
              console.log(
                "signIn event: Creating/updating user by email",
                user.email
              );
              await convex.mutation(api.users.createUser, {
                name: user.name || "User",
                email: user.email,
                image: user.image || "",
                scopes: account.scope,
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
              });
            }
          } catch (error) {
            // This will happen on first deploy before the API is available
            console.error(
              "Error calling Convex API (functions may not be deployed yet):",
              error
            );
          }
        }
      } catch (error) {
        console.error("Error in signIn event:", error);
      }
    },
  },
  debug: true, // Enable debug logs
});

// Type declarations for NextAuth
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    scope?: string;
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    scope?: string;
    sub?: string;
  }
}
