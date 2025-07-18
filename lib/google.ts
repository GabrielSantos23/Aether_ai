import { google } from "googleapis";
import { api } from "@/convex/_generated/api";
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";

export async function getDriveClient(userId: Id<"users">) {
  // 1. Fetch the stored Google account row
  const account = await fetchQuery(api.accounts.getGoogleAccount, {} as any, {
    // `userId` is inferred from session – no args required
  });

  if (!account) {
    throw new Error("Google account not linked to user");
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    scope: account.scope,
  });

  // googleapis fires a "tokens" event when it refreshes
  oauth2.on("tokens", async (tokens: any) => {
    await fetchMutation(api.accounts.updateGoogleTokens, {
      accountId: account._id,
      access_token: tokens.access_token,
      expires_at: tokens.expiry_date
        ? Math.floor(tokens.expiry_date / 1000)
        : undefined,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
    } as any);
  });

  return google.drive({ version: "v3", auth: oauth2 });
}
