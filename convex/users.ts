import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Get a user by their ID.
 *
 * @param {Id<"users">} id - The ID of the user to fetch.
 * @returns {Promise<Doc<"users"> | null>} - The user document or null if not found.
 */
export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    // Fetches a user document from the 'users' table using the provided ID.
    const user = await ctx.db.get(args.id);
    return user;
  },
});

/**
 * Get the settings for the currently authenticated user.
 *
 * This query retrieves the user's settings from the 'userSettings' table using the 'by_user' index.
 * It requires the user to be authenticated.
 *
 * @returns {Promise<Doc<"userSettings"> | null>} - The user settings document or null if not authenticated or has no settings.
 */
export const getMySettings = query({
  handler: async (ctx) => {
    // Get the identity of the currently logged-in user.
    const identity = await ctx.auth.getUserIdentity();

    // If there is no authenticated user, return null.
    if (!identity) {
      console.warn("User is not authenticated. Cannot fetch settings.");
      return null;
    }

    // Query the 'userSettings' table using the index.
    // Using `as any as Id<"users">` as a workaround for formatters that strip simple type casts.
    const userSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) =>
        q.eq("userId", identity.subject as any as Id<"users">)
      )
      .unique();

    return userSettings;
  },
});

/**
 * Create or update settings for the currently authenticated user.
 *
 * This mutation allows an authenticated user to update their personal settings.
 * If settings for the user do not exist, a new document will be created.
 * Otherwise, the existing document will be patched with the new values.
 */
export const updateUserSettings = mutation({
  // Define the arguments that can be passed to this mutation.
  // All arguments are optional, allowing for partial updates.
  args: {
    uploadthing_key: v.optional(v.string()),
    tavily_key: v.optional(v.string()),
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
    disabledModels: v.optional(v.array(v.string())),
    mem0Enabled: v.optional(v.boolean()),
    observations: v.optional(v.array(v.string())),
    action: v.optional(
      v.union(v.literal("create"), v.literal("update"), v.literal("delete"))
    ),
    existing_knowledge_id: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get the identity of the currently logged-in user.
    const identity = await ctx.auth.getUserIdentity();

    // If there is no authenticated user, throw an error.
    if (!identity) {
      throw new Error("User must be authenticated to update settings.");
    }

    // Use a more robust cast to prevent code formatters from breaking the type.
    const userId = identity.subject as any as Id<"users">;

    // Separate control fields from actual settings
    const { action, existing_knowledge_id, ...incomingSettings } = args as any;

    // Check if user settings already exist using the 'by_user' index.
    const existingSettings = await ctx.db
      .query("userSettings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (action === "delete") {
      // If deletion requested, clear provided fields
      if (existingSettings) {
        const fieldsToClear: any = {};
        for (const key of Object.keys(incomingSettings)) {
          // Only clear if the field exists in schema
          fieldsToClear[key] = undefined;
        }
        if (Object.keys(fieldsToClear).length > 0) {
          await ctx.db.patch(existingSettings._id, fieldsToClear);
        }
      }
      return;
    }

    if (existingSettings) {
      // Merge observations uniquely if provided
      let patchArgs: any = { ...incomingSettings };
      if (
        incomingSettings.observations &&
        incomingSettings.observations.length > 0
      ) {
        const existingObs = existingSettings.observations || [];
        const combined = Array.from(
          new Set([...existingObs, ...incomingSettings.observations])
        );
        patchArgs.observations = combined;
      }
      // If settings exist, patch the document with the new arguments.
      await ctx.db.patch(existingSettings._id, patchArgs);
    } else {
      // If settings do not exist, create a new document.
      await ctx.db.insert("userSettings", { userId, ...incomingSettings });
    }
  },
});

export const storeUser = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.insert("users", args);
    return user;
  },
});
