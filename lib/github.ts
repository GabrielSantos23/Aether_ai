import { Octokit } from "octokit";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export async function getOctokit() {
  const account = await fetchQuery(api.accounts.getGitHubAccount, {} as any, {} as any);
  if (!account || !account.access_token) {
    throw new Error("GitHub account not linked");
  }
  return new Octokit({ auth: account.access_token });
} 