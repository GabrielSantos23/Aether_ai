import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";
import { getViewerId } from "./auth";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// Store or update user information in the database
export const storeUser = mutation({
  args: {
    tokenIdentifier: v.string(),
    name: v.string(),
    email: v.string(),
    image: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // First check if user already exists by tokenIdentifier
    let existingUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .first();

    // If not found by tokenIdentifier, try to find by email
    if (!existingUser) {
      existingUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first();
    }

    if (existingUser) {
      // Update existing user and ensure tokenIdentifier is updated
      await ctx.db.patch(existingUser._id, {
        name: args.name,
        email: args.email,
        image: args.image,
        tokenIdentifier: args.tokenIdentifier, // Update tokenIdentifier to the current one
      });
      return existingUser._id;
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        tokenIdentifier: args.tokenIdentifier,
        name: args.name,
        email: args.email,
        image: args.image,
      });
    }
  },
});

// Get the current user from the database
export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }

    // Look up user by tokenIdentifier
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .first();

    // If not found by tokenIdentifier, try to find by email if available
    const email = identity.email;
    if (!user && email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
    }

    return user;
  },
});

// List todos for the current user
export const listTodos = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("User is not authenticated");
    }

    const tokenIdentifier = identity.tokenIdentifier;
    const email = identity.email || "";

    // Get user from database
    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    // If not found by tokenIdentifier, try to find by email if we have one
    if (!user && email) {
      user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Use a default value if tokenIdentifier is undefined (shouldn't happen)
    const userIdentifier = user.tokenIdentifier || tokenIdentifier;

    // Get todos for this user - use the user ID from the database
    const todos = await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("userId"), userIdentifier))
      .order("desc")
      .collect();

    return {
      viewer: user.email,
      todos,
    };
  },
});

// Add a new todo
export const addTodo = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("User is not authenticated");
    }

    const tokenIdentifier = identity.tokenIdentifier;
    const now = Date.now();

    const id = await ctx.db.insert("todos", {
      title: args.title,
      completed: false,
      userId: tokenIdentifier,
      createdBy: identity.name || "Unknown",
      createdAt: now,
      updatedAt: now,
    });

    console.log("Added new todo with id:", id);
    return id;
  },
});

// Toggle todo completion status
export const toggleTodo = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("User is not authenticated");
    }

    const todo = await ctx.db.get(args.id);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Verify ownership
    if (todo.userId !== identity.tokenIdentifier) {
      throw new Error("Not authorized to update this todo");
    }

    await ctx.db.patch(args.id, {
      completed: !todo.completed,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

// Delete a todo
export const deleteTodo = mutation({
  args: {
    id: v.id("todos"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("User is not authenticated");
    }

    const todo = await ctx.db.get(args.id);
    if (!todo) {
      throw new Error("Todo not found");
    }

    // Verify ownership
    if (todo.userId !== identity.tokenIdentifier) {
      throw new Error("Not authorized to delete this todo");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Query data by running Convex queries
    const data = await ctx.runQuery(api.myFunctions.listTodos, {});
    console.log(data);

    // Write data by running Convex mutations
    await ctx.runMutation(api.myFunctions.addTodo, {
      title: args.title,
    });
  },
});

// Update a user's tokenIdentifier
export const updateUserTokenIdentifier = mutation({
  args: {
    email: v.string(),
    tokenIdentifier: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Find user by email
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (user) {
      // Update the tokenIdentifier
      await ctx.db.patch(user._id, {
        tokenIdentifier: args.tokenIdentifier,
      });
      return user._id;
    }

    return null;
  },
});
