import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  todos: defineTable({
    title: v.string(),
    completed: v.boolean(),
    userId: v.string(),
    createdBy: v.optional(v.string()),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  }),
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.string(),
    // This is the user's ID from Clerk, used as the token identifier
    tokenIdentifier: v.string(),
    scopes: v.optional(v.string()),
    accessToken: v.optional(v.string()), // IMPORTANT: Encrypt this in production
    refreshToken: v.optional(v.string()), // IMPORTANT: Encrypt this in production
    encryptedAccessToken: v.optional(v.string()), // For storing encrypted tokens
    encryptedRefreshToken: v.optional(v.string()), // For storing encrypted tokens
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  // Add this new table for linking accounts
  accounts: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    providerAccountId: v.string(), // This is the unique Google User ID
    // Other account fields
    access_token: v.optional(v.string()),
    refresh_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    token_type: v.optional(v.string()),
    scope: v.optional(v.string()),
    id_token: v.optional(v.string()),
    session_state: v.optional(v.string()),
  }).index("by_provider_account", ["provider", "providerAccountId"]),

  userSettings: defineTable({
    userId: v.id("users"),
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
    disabledModels: v.optional(v.array(v.string())), // Array of disabled model IDs
  }).index("by_user", ["userId"]),

  apiKeys: defineTable({
    userId: v.id("users"),
    service: v.union(
      v.literal("gemini"),
      v.literal("groq"),
      v.literal("openrouter"),
      v.literal("deepgram")
    ),
    name: v.string(),
    key: v.string(),
    is_default: v.optional(v.boolean()),
  }).index("by_user_and_service", ["userId", "service"]),

  chats: defineTable({
    userId: v.id("users"),
    title: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    shareId: v.optional(v.string()),
    isShared: v.optional(v.boolean()),
    isGeneratingTitle: v.optional(v.boolean()),
    isBranch: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_share_id", ["shareId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    modelId: v.optional(v.string()),
    thinking: v.optional(v.string()), // Store reasoning content separately
    thinkingDuration: v.optional(v.number()), // Store thinking duration in seconds
    isComplete: v.optional(v.boolean()), // For streaming messages
    isCancelled: v.optional(v.boolean()), // For cancelling streaming messages
    attachments: v.optional(
      v.array(
        v.object({
          name: v.string(),
          type: v.string(),
          size: v.number(),
          url: v.string(),
        })
      )
    ),
    toolCalls: v.optional(
      v.array(
        v.object({
          toolCallId: v.string(),
          toolName: v.string(),
          args: v.any(),
          result: v.optional(v.any()),
        })
      )
    ),
    createdAt: v.number(),
  })
    .index("by_chat", ["chatId"])
    .index("by_chat_created", ["chatId", "createdAt"]),
});
