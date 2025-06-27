import {
  query,
  mutation,
  internalQuery,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { MutationCtx, QueryCtx } from "./_generated/server";

// Helper function to get or create a user record
async function getOrCreateUserId(
  ctx: MutationCtx | QueryCtx,
  tokenIdentifier: string
) {
  // First, try to find the user by tokenIdentifier
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
    .first();

  if (user) {
    return user._id;
  }

  // If we're in a query context, we can't create a user
  if ("query" in ctx.db && !("insert" in ctx.db)) {
    throw new Error("User not found and cannot create in query context");
  }

  // If user doesn't exist, create a minimal user record
  const userId = await (ctx.db as MutationCtx["db"]).insert("users", {
    name: "User",
    email: "user@example.com", // This should be updated with actual user data
    image: "",
    tokenIdentifier: tokenIdentifier,
  });

  return userId;
}

// Find a user by their provider account ID
export const getUserByProviderAccountId = query({
  args: { providerAccountId: v.string() },
  async handler(ctx, args) {
    const account = await ctx.db
      .query("accounts")
      .withIndex("by_provider_account", (q) =>
        q
          .eq("provider", "google")
          .eq("providerAccountId", args.providerAccountId)
      )
      .unique();

    if (!account) {
      return null;
    }
    return await ctx.db.get(account.userId);
  },
});

// Update user's OAuth tokens and scopes
export const updateUserOAuth = mutation({
  args: {
    userId: v.id("users"),
    scopes: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
  },
  handler: async (ctx, { userId, scopes, accessToken, refreshToken }) => {
    await ctx.db.patch(userId, {
      scopes: scopes,
      accessToken: accessToken, // Remember to encrypt in production
      refreshToken: refreshToken, // Remember to encrypt in production
    });
  },
});

// New mutation to create a user record when signing up
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    scopes: v.string(),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { name, email, image, scopes, accessToken, refreshToken }
  ) => {
    // Check if user already exists by email
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      // User already exists, update their information and OAuth fields
      console.log("Updating existing user:", existingUser._id);
      await ctx.db.patch(existingUser._id, {
        name,
        email,
        image: image || existingUser.image,
        scopes,
        accessToken: accessToken,
        refreshToken: refreshToken,
      });
      return existingUser._id;
    }

    // Create new user with a generated tokenIdentifier
    const tokenIdentifier = `auth:${email}:${Date.now()}`;
    console.log("Creating new user with tokenIdentifier:", tokenIdentifier);

    const userId = await ctx.db.insert("users", {
      name,
      email,
      image: image || "",
      tokenIdentifier,
      scopes,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

    // Create default user settings
    await ctx.db.insert("userSettings", {
      userId,
      mainFont: "inter",
      codeFont: "fira-code",
      sendBehavior: "enter",
      autoSave: true,
      showTimestamps: true,
      disabledModels: [],
    });

    return userId;
  },
});

// Add a function to update user's Google Drive access
export const updateGoogleDriveAccess = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    scope: v.string(),
    email: v.string(),
  },
  handler: async (ctx, { accessToken, refreshToken, scope, email }) => {
    console.log("updateGoogleDriveAccess: Looking up user with email", email);

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      console.log("updateGoogleDriveAccess: User not found");
      throw new Error("User not found");
    }

    console.log("updateGoogleDriveAccess: Found user", {
      userId: user._id,
      name: user.name,
      email: user.email,
    });

    // Update the user with the Google Drive access token and scope
    console.log("updateGoogleDriveAccess: Updating user with scope", scope);
    await ctx.db.patch(user._id, {
      scopes: scope,
      accessToken: accessToken,
      refreshToken: refreshToken,
    });

    console.log("updateGoogleDriveAccess: Successfully updated user");
    return { success: true, userId: user._id };
  },
});

// Add a function to check if user has Google Drive access
export const hasGoogleDriveAccess = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    if (!args.email) {
      return false;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!user || !user.scopes) {
      return false;
    }
    return user.scopes.includes("https://www.googleapis.com/auth/drive");
  },
});

export const updateUserSettings = mutation({
  args: {
    userName: v.optional(v.string()),
    userRole: v.optional(v.string()),
    userTraits: v.optional(v.array(v.string())),
    userAdditionalInfo: v.optional(v.string()),
    promptTemplate: v.optional(v.string()),
    mainFont: v.optional(
      v.union(
        v.literal("inter"),
        v.literal("system"),
        v.literal("serif"),
        v.literal("mono"),
        v.literal("roboto-slab")
      )
    ),
    codeFont: v.optional(
      v.union(
        v.literal("fira-code"),
        v.literal("mono"),
        v.literal("consolas"),
        v.literal("jetbrains"),
        v.literal("source-code-pro")
      )
    ),
    sendBehavior: v.optional(
      v.union(v.literal("enter"), v.literal("shiftEnter"), v.literal("button"))
    ),
    autoSave: v.optional(v.boolean()),
    showTimestamps: v.optional(v.boolean()),
    uploadthing_key: v.optional(v.string()),
    tavily_key: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const settings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (settings) {
      await ctx.db.patch(settings._id, args);
    } else {
      await ctx.db.insert("userSettings", {
        userId,
        ...args,
      });
    }
  },
});

export const getMySettings = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Try to find the user first
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (!user) return null;

    return await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});
