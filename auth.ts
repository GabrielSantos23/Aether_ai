import { ConvexAdapter } from "@/app/ConvexAdapter";
import { SignJWT, importPKCS8 } from "jose";
import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";

import Google from "next-auth/providers/google";

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

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("Missing Google Client ID or Secret");
}

if (!process.env.NOTION_CLIENT_ID || !process.env.NOTION_CLIENT_SECRET) {
  throw new Error("Missing Notion Client ID or Secret");
}

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  throw new Error("Missing GitHub Client ID or Secret");
}

const CONVEX_SITE_URL = process.env.NEXT_PUBLIC_CONVEX_URL!.replace(
  /.cloud$/,
  ".site"
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope:
            "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        },
      },
    }),
  ],
  adapter: ConvexAdapter as any,
  callbacks: {
    async signIn({ user, account }) {
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
      const userId =
        (token?.sub as string | undefined) ?? (session.user as any)?.id;

      (session.user as any).id = userId;
      (session as any).userId = userId;

      const privateKey = await importPKCS8(
        process.env.CONVEX_AUTH_PRIVATE_KEY!,
        "RS256"
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
