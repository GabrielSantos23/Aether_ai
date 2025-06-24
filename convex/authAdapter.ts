import { partial } from "convex-helpers/validators";
import {
  customMutation,
  customQuery,
} from "convex-helpers/server/customFunctions";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const adapterQuery = customQuery(query, {
  args: { secret: v.string() },
  input: async (_ctx, { secret }) => {
    checkSecret(secret);
    return { ctx: {}, args: {} };
  },
});

const adapterMutation = customMutation(mutation, {
  args: { secret: v.string() },
  input: async (_ctx, { secret }) => {
    checkSecret(secret);
    return { ctx: {}, args: {} };
  },
});

function checkSecret(secret: string) {
  if (process.env.CONVEX_AUTH_ADAPTER_SECRET === undefined) {
    throw new Error(
      "Missing CONVEX_AUTH_ADAPTER_SECRET Convex environment variable"
    );
  }
  if (secret !== process.env.CONVEX_AUTH_ADAPTER_SECRET) {
    throw new Error("Adapter API called without correct secret value");
  }
}

// Define minimal user schema for NextAuth
const userSchema = {
  email: v.string(),
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  emailVerified: v.optional(v.number()),
};

// Define session schema for NextAuth
const sessionSchema = {
  expires: v.number(),
  sessionToken: v.string(),
  userId: v.string(),
};

// Define account schema for NextAuth
const accountSchema = {
  userId: v.string(),
  type: v.string(),
  provider: v.string(),
  providerAccountId: v.string(),
  refresh_token: v.optional(v.string()),
  access_token: v.optional(v.string()),
  expires_at: v.optional(v.number()),
  token_type: v.optional(v.string()),
  scope: v.optional(v.string()),
  id_token: v.optional(v.string()),
  session_state: v.optional(v.string()),
};

// Define verification token schema for NextAuth
const verificationTokenSchema = {
  identifier: v.string(),
  token: v.string(),
  expires: v.number(),
};

// NextAuth adapter functions that map to our new schema
export const createUser = adapterMutation({
  args: { user: v.object(userSchema) },
  handler: async (ctx, { user }) => {
    // Create a user with NextAuth data and generate a tokenIdentifier
    const tokenIdentifier = `nextauth:${user.email}`;

    // Insert into our users table with the format required by our schema
    const userId = await ctx.db.insert("users", {
      name: user.name || "User",
      email: user.email,
      image: user.image || "",
      tokenIdentifier,
    });

    // Return the user with the ID
    return { ...user, id: userId };
  },
});

export const getUser = adapterQuery({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    try {
      // Try to get user by ID (convert string to Id<"users">)
      const userId = id as unknown as Id<"users">;
      const user = await ctx.db.get(userId);

      if (!user) return null;

      // Return in NextAuth format
      return {
        id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    } catch (e) {
      return null;
    }
  },
});

export const getUserByEmail = adapterQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) return null;

    // Return in NextAuth format
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },
});

export const getUserByAccount = adapterQuery({
  args: { provider: v.string(), providerAccountId: v.string() },
  handler: async (ctx, { provider, providerAccountId }) => {
    // Generate the tokenIdentifier that would have been created
    const tokenIdentifier = `${provider}:${providerAccountId}`;

    // Find user by tokenIdentifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (!user) return null;

    // Return in NextAuth format
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  },
});

// The remaining adapter functions can be implemented as needed for NextAuth
// but they will need to be adjusted to work with our new schema

// For now, we'll provide stubs that return null or empty arrays
// These can be implemented properly as needed

export const createSession = adapterMutation({
  args: { session: v.object(sessionSchema) },
  handler: async (ctx, { session }) => {
    // In our new schema, we're not storing sessions in the database
    // Return a mock session that NextAuth can use
    return { ...session, id: "session_id" };
  },
});

export const getSessionAndUser = adapterQuery({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    // In our new schema, we're not storing sessions in the database
    return null;
  },
});

export const updateUser = adapterMutation({
  args: {
    user: v.object({
      id: v.string(),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      emailVerified: v.optional(v.number()),
    }),
  },
  handler: async (ctx, { user }) => {
    try {
      // Get the existing user (convert string to Id<"users">)
      const userId = user.id as unknown as Id<"users">;
      const existingUser = await ctx.db.get(userId);

      if (!existingUser) return null;

      // Update the user with the new data
      const updates: any = {};
      if (user.name) updates.name = user.name;
      if (user.email) updates.email = user.email;
      if (user.image) updates.image = user.image;

      await ctx.db.patch(userId, updates);

      // Return the updated user
      return {
        id: user.id,
        name: existingUser.name,
        email: existingUser.email,
        image: existingUser.image,
        ...updates,
      };
    } catch (e) {
      return null;
    }
  },
});

// Add stubs for the remaining adapter functions
// These can be implemented properly as needed

export const deleteUser = adapterMutation({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    // Convert string to Id<"users">
    const userId = id as unknown as Id<"users">;
    return null;
  },
});

export const linkAccount = adapterMutation({
  args: { account: v.object(accountSchema) },
  handler: async (ctx, { account }) => {
    return account;
  },
});

export const unlinkAccount = adapterMutation({
  args: { provider: v.string(), providerAccountId: v.string() },
  handler: async (ctx, { provider, providerAccountId }) => {
    return null;
  },
});

export const createVerificationToken = adapterMutation({
  args: { verificationToken: v.object(verificationTokenSchema) },
  handler: async (ctx, { verificationToken }) => {
    return verificationToken;
  },
});

export const useVerificationToken = adapterMutation({
  args: { identifier: v.string(), token: v.string() },
  handler: async (ctx, { identifier, token }) => {
    return null;
  },
});

export const deleteSession = adapterMutation({
  args: { sessionToken: v.string() },
  handler: async (ctx, { sessionToken }) => {
    return null;
  },
});

export const updateSession = adapterMutation({
  args: {
    session: v.object({
      sessionToken: v.string(),
      expires: v.number(),
    }),
  },
  handler: async (ctx, { session }) => {
    return null;
  },
});
