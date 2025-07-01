import { defineSchema, defineTable } from "convex/server";
import { Validator, v } from "convex/values";

// The users, accounts, sessions and verificationTokens tables are modeled
// from https://authjs.dev/getting-started/adapters#models

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    emailVerified: v.optional(v.number()),
    image: v.optional(v.string()),
    tokenIdentifier: v.optional(v.string()),
  }).index("email", ["email"]).index("by_token", ["tokenIdentifier"]),

  accounts: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("email"),
      v.literal("oidc"),
      v.literal("oauth"),
      v.literal("webauthn")
    ),
    provider: v.string(),
    providerAccountId: v.string(),
    refresh_token: v.optional(v.string()),
    access_token: v.optional(v.string()),
    expires_at: v.optional(v.number()),
    token_type: v.optional(v.string()),
    scope: v.optional(v.string()),
    id_token: v.optional(v.string()),
    session_state: v.optional(v.string()),
  })
    .index("providerAndAccountId", ["provider", "providerAccountId"])
    .index("userId", ["userId"]),

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
    isPinned: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_share_id", ["shareId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    modelId: v.optional(v.string()),
    thinking: v.optional(v.string()),
    thinkingDuration: v.optional(v.number()),
    isComplete: v.optional(v.boolean()),
    isCancelled: v.optional(v.boolean()),
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
  numbers: defineTable({ value: v.number() }),
  sessions: defineTable({
    userId: v.id("users"),
    expires: v.number(),
    sessionToken: v.string(),
  })
    .index("sessionToken", ["sessionToken"])
    .index("userId", ["userId"]),
  verificationTokens: defineTable({
    identifier: v.string(),
    token: v.string(),
    expires: v.number(),
  }).index("identifierToken", ["identifier", "token"]),

  authenticators: defineTable({
    credentialID: v.string(),
    userId: v.id("users"),
    providerAccountId: v.string(),
    credentialPublicKey: v.string(),
    counter: v.number(),
    credentialDeviceType: v.string(),
    credentialBackedUp: v.boolean(),
    transports: v.optional(v.string()),
  })
    .index("userId", ["userId"])
    .index("credentialID", ["credentialID"]),
});

// export const userSchema = {
//   email: v.string(),
//   name: v.optional(v.string()),
//   emailVerified: v.optional(v.number()),
//   image: v.optional(v.string()),
// };

// export const userSettings = defineTable({
//   userId: v.id("users"),
//   uploadthing_key: v.optional(v.string()),
//   tavily_key: v.optional(v.string()),
//   userName: v.optional(v.string()),
//   userRole: v.optional(v.string()),
//   userTraits: v.optional(v.array(v.string())),
//   userAdditionalInfo: v.optional(v.string()),
//   promptTemplate: v.optional(v.string()),
//   mainFont: v.optional(
//     v.union(
//       v.literal("inter"),
//       v.literal("system"),
//       v.literal("serif"),
//       v.literal("mono"),
//       v.literal("roboto-slab")
//     )
//   ),
//   codeFont: v.optional(
//     v.union(
//       v.literal("fira-code"),
//       v.literal("mono"),
//       v.literal("consolas"),
//       v.literal("jetbrains"),
//       v.literal("source-code-pro")
//     )
//   ),
//   sendBehavior: v.optional(
//     v.union(v.literal("enter"), v.literal("shiftEnter"), v.literal("button"))
//   ),
//   autoSave: v.optional(v.boolean()),
//   showTimestamps: v.optional(v.boolean()),
//   disabledModels: v.optional(v.array(v.string())), // Array of disabled model IDs
// }).index("by_user", ["userId"]);

// export const apiKeys = defineTable({
//   userId: v.id("users"),
//   service: v.union(
//     v.literal("gemini"),
//     v.literal("groq"),
//     v.literal("openrouter"),
//     v.literal("deepgram")
//   ),
//   name: v.string(),
//   key: v.string(),
//   is_default: v.optional(v.boolean()),
// }).index("by_user_and_service", ["userId", "service"]);

// export const chats = defineTable({
//   userId: v.id("users"),
//   title: v.string(),
//   createdAt: v.number(),
//   updatedAt: v.number(),
//   shareId: v.optional(v.string()),
//   isShared: v.optional(v.boolean()),
//   isGeneratingTitle: v.optional(v.boolean()),
//   isBranch: v.optional(v.boolean()),
// })
//   .index("by_user", ["userId"])
//   .index("by_share_id", ["shareId"]);

// export const messages = defineTable({
//   chatId: v.id("chats"),
//   role: v.union(v.literal("user"), v.literal("assistant")),
//   content: v.string(),
//   modelId: v.optional(v.string()),
//   thinking: v.optional(v.string()), // Store reasoning content separately
//   thinkingDuration: v.optional(v.number()), // Store thinking duration in seconds
//   isComplete: v.optional(v.boolean()), // For streaming messages
//   isCancelled: v.optional(v.boolean()), // For cancelling streaming messages
//   attachments: v.optional(
//     v.array(
//       v.object({
//         name: v.string(),
//         type: v.string(),
//         size: v.number(),
//         url: v.string(),
//       })
//     )
//   ),
//   toolCalls: v.optional(
//     v.array(
//       v.object({
//         toolCallId: v.string(),
//         toolName: v.string(),
//         args: v.any(),
//         result: v.optional(v.any()),
//       })
//     )
//   ),
//   createdAt: v.number(),
// })
//   .index("by_chat", ["chatId"])
//   .index("by_chat_created", ["chatId", "createdAt"]);

// export const numbers = defineTable({ value: v.number() });

// export const sessionSchema = {
//   userId: v.id("users"),
//   expires: v.number(),
//   sessionToken: v.string(),
// };

// export const accountSchema = {
//   userId: v.id("users"),
//   type: v.union(
//     v.literal("email"),
//     v.literal("oidc"),
//     v.literal("oauth"),
//     v.literal("webauthn")
//   ),
//   provider: v.string(),
//   providerAccountId: v.string(),
//   refresh_token: v.optional(v.string()),
//   access_token: v.optional(v.string()),
//   expires_at: v.optional(v.number()),
//   token_type: v.optional(v.string()),
//   scope: v.optional(v.string()),
//   id_token: v.optional(v.string()),
//   session_state: v.optional(v.string()),
// };

// export const verificationTokenSchema = {
//   identifier: v.string(),
//   token: v.string(),
//   expires: v.number(),
// };

// export const authenticatorSchema = {
//   credentialID: v.string(),
//   userId: v.id("users"),
//   providerAccountId: v.string(),
//   credentialPublicKey: v.string(),
//   counter: v.number(),
//   credentialDeviceType: v.string(),
//   credentialBackedUp: v.boolean(),
//   transports: v.optional(v.string()),
// };

// const authTables = {
//   users: defineTable(userSchema).index("email", ["email"]),
//   sessions: defineTable(sessionSchema)
//     .index("sessionToken", ["sessionToken"])
//     .index("userId", ["userId"]),
//   accounts: defineTable(accountSchema)
//     .index("providerAndAccountId", ["provider", "providerAccountId"])
//     .index("userId", ["userId"]),
//   verificationTokens: defineTable(verificationTokenSchema).index(
//     "identifierToken",
//     ["identifier", "token"]
//   ),
//   authenticators: defineTable(authenticatorSchema)
//     .index("userId", ["userId"])
//     .index("credentialID", ["credentialID"]),
// };

// export default defineSchema({
//   ...authTables,
//   userSettings,
//   apiKeys,
//   chats,
//   messages,
//   numbers: defineTable({
//     value: v.number(),
//   }),
// });
