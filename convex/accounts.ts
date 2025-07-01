import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

/**
 * Fetch the Google OAuth account for the currently authenticated user.
 */
export const getGoogleAccount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject as Id<"users">;
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    return accounts.find((a) => a.provider === "google") ?? null;
  },
});

/**
 * Check the status of the Google OAuth token and return debug information
 */
export const checkGoogleTokenStatus = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { status: "error", message: "Not authenticated" };

    const userId = identity.subject as Id<"users">;
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    const googleAccount = accounts.find((a) => a.provider === "google");
    
    if (!googleAccount) {
      return { status: "error", message: "Google account not connected" };
    }
    
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    const isExpired = googleAccount.expires_at && googleAccount.expires_at < now;
    
    // Check if we have a refresh token
    const hasRefreshToken = !!googleAccount.refresh_token;
    
    // Check if we have the required scopes
    const scopes = googleAccount.scope?.split(" ") ?? [];
    const hasDriveScope = scopes.some(scope => scope.includes("https://www.googleapis.com/auth/drive"));
    
    return {
      status: "success",
      isExpired: isExpired,
      expiresIn: googleAccount.expires_at ? googleAccount.expires_at - now : "unknown",
      hasRefreshToken: hasRefreshToken,
      hasDriveScope: hasDriveScope,
      scopes: scopes,
      tokenLength: googleAccount.access_token?.length || 0,
    };
  },
});

/**
 * Update stored Google OAuth tokens when they are refreshed.
 */
export const updateGoogleTokens = mutation({
  args: {
    accountId: v.id("accounts"),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    refresh_token: v.optional(v.string()),
    scope: v.optional(v.string()),
    token_type: v.optional(v.string()),
  },
  handler: async (ctx, { accountId, ...data }) => {
    await ctx.db.patch(accountId, data);
  },
});

/**
 * Delete the Google OAuth account row for the current user.
 * This effectively revokes the app's Drive access (until the user re-connects).
 */
export const deleteGoogleAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject as Id<"users">;

    const googleAccount = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect()
      .then((accounts) => accounts.find((a) => a.provider === "google") ?? null);

    if (!googleAccount) return; // nothing to delete

    await ctx.db.delete(googleAccount._id);
  },
});

// ---------- NOTION ----------

export const getNotionAccount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject as Id<"users">;
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    return accounts.find((a) => a.provider === "notion") ?? null;
  },
});

export const updateNotionTokens = mutation({
  args: {
    accountId: v.id("accounts"),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    refresh_token: v.optional(v.string()),
    scope: v.optional(v.string()),
    token_type: v.optional(v.string()),
  },
  handler: async (ctx, { accountId, ...data }) => {
    await ctx.db.patch(accountId, data);
  },
});

export const deleteNotionAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject as Id<"users">;
    const notionAccount = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect()
      .then((accounts) => accounts.find((a) => a.provider === "notion") ?? null);

    if (!notionAccount) return;
    await ctx.db.delete(notionAccount._id);
  },
});

// ---------- GITHUB ----------

export const getGitHubAccount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const userId = identity.subject as Id<"users">;
    const accounts = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();

    return accounts.find((a) => a.provider === "github") ?? null;
  },
});

export const updateGitHubTokens = mutation({
  args: {
    accountId: v.id("accounts"),
    access_token: v.optional(v.string()),
    scope: v.optional(v.string()),
    token_type: v.optional(v.string()),
  },
  handler: async (ctx, { accountId, ...data }) => {
    await ctx.db.patch(accountId, data);
  },
});

export const deleteGitHubAccount = mutation({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject as Id<"users">;
    const ghAccount = await ctx.db
      .query("accounts")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect()
      .then((acc) => acc.find((a) => a.provider === "github") ?? null);

    if (!ghAccount) return;
    await ctx.db.delete(ghAccount._id);
  },
}); 