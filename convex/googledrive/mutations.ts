import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { ConvexError } from "convex/values";

// Save Google Drive tokens after authentication
export const saveGoogleDriveTokens = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get the user ID from the token identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Check if tokens already exist
    const existingTokens = await ctx.db
      .query("googleDriveTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existingTokens) {
      // Update existing tokens
      await ctx.db.patch(existingTokens._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
      });
      return existingTokens._id;
    } else {
      // Create new tokens
      return await ctx.db.insert("googleDriveTokens", {
        userId: user._id,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope,
      });
    }
  },
});

// Refresh Google Drive access token
export const refreshGoogleDriveToken = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get the user ID from the token identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get the existing tokens
    const tokens = await ctx.db
      .query("googleDriveTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!tokens) {
      throw new ConvexError("Google Drive not connected");
    }

    // This would be implemented to call the Google OAuth token endpoint
    // with the refresh token to get a new access token
    // For now, we'll just return a placeholder
    return { success: false, message: "Token refresh not implemented yet" };
  },
});

// Delete Google Drive tokens
export const disconnectGoogleDrive = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // Get the user ID from the token identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get the existing tokens
    const tokens = await ctx.db
      .query("googleDriveTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (tokens) {
      await ctx.db.delete(tokens._id);
    }

    return { success: true };
  },
});
