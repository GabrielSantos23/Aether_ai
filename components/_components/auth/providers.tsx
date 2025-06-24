import DiscordProvider, {
  type DiscordProfile,
} from "next-auth/providers/discord";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import GithubProvider, { type GitHubProfile } from "next-auth/providers/github";
import TwitterProvider, {
  type TwitterProfile,
} from "next-auth/providers/twitter";
import NotionProvider, { type NotionProfile } from "next-auth/providers/notion";

import type { OAuthConfig } from "next-auth/providers";

export const providers: (
  | OAuthConfig<DiscordProfile>
  | OAuthConfig<GoogleProfile>
  | OAuthConfig<GitHubProfile>
  | OAuthConfig<TwitterProfile>
  | OAuthConfig<NotionProfile>
)[] = [
  ...("AUTH_DISCORD_ID" in process.env && "AUTH_DISCORD_SECRET" in process.env
    ? [
        DiscordProvider({
          clientId: process.env.AUTH_DISCORD_ID,
          clientSecret: process.env.AUTH_DISCORD_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  ...("AUTH_GOOGLE_ID" in process.env && "AUTH_GOOGLE_SECRET" in process.env
    ? [
        GoogleProvider({
          clientId: process.env.AUTH_GOOGLE_ID,
          clientSecret: process.env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  ...("AUTH_GITHUB_ID" in process.env && "AUTH_GITHUB_SECRET" in process.env
    ? [
        GithubProvider({
          clientId: process.env.AUTH_GITHUB_ID,
          clientSecret: process.env.AUTH_GITHUB_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  ...("AUTH_TWITTER_ID" in process.env && "AUTH_TWITTER_SECRET" in process.env
    ? [
        TwitterProvider({
          clientId: process.env.AUTH_TWITTER_ID,
          clientSecret: process.env.AUTH_TWITTER_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      ]
    : []),
  ...("AUTH_NOTION_ID" in process.env && "AUTH_NOTION_SECRET" in process.env
    ? [
        NotionProvider({
          clientId: process.env.AUTH_NOTION_ID,
          clientSecret: process.env.AUTH_NOTION_SECRET,
          redirectUri: `${process.env.APP_URL}/api/auth/callback/notion`,
        }),
      ]
    : []),
];
