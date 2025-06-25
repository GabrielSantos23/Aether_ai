import { query } from "../_generated/server";
import { ConvexError } from "convex/values";

// Check if the user has connected Google Drive
export const isGoogleDriveConnected = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { connected: false };
    }

    // Get the user ID from the token identifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) {
      return { connected: false };
    }

    // Check if tokens exist
    const tokens = await ctx.db
      .query("googleDriveTokens")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return { connected: !!tokens };
  },
});
