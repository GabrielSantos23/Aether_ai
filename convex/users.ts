import { query, mutation } from "./_generated/server";
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

// New mutation to create a user record when signing up
export const createUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, { name, email, image }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    if (existingUser) {
      // User already exists, update their information
      await ctx.db.patch(existingUser._id, {
        name,
        email,
        image: image || existingUser.image,
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      name,
      email,
      image: image || "",
      tokenIdentifier: identity.tokenIdentifier,
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
