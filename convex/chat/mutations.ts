import { action, mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { MutationCtx, QueryCtx } from "../_generated/server";
import { getOrCreateUserId } from "./shared";
import { models } from "../../lib/models";

// MUTATIONS - for database modifications

export const createChat = mutation({
  args: {
    title: v.optional(v.string()),
  },
  handler: async (ctx, { title }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const now = Date.now();
    const chatId = await ctx.db.insert("chats", {
      userId,
      title: title || "New chat",
      createdAt: now,
      updatedAt: now,
      isGeneratingTitle: false,
    });

    return chatId;
  },
});

export const addMessage = mutation({
  args: {
    chatId: v.id("chats"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    modelId: v.optional(v.string()),
    thinking: v.optional(v.string()),
    thinkingDuration: v.optional(v.number()),
    isComplete: v.optional(v.boolean()),
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
  },
  handler: async (
    ctx,
    {
      chatId,
      role,
      content,
      modelId,
      thinking,
      thinkingDuration,
      isComplete,
      attachments,
    }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    // Verify chat ownership
    const chat = await ctx.db.get(chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Replace with direct ownership check using userId derived above
    if (chat.userId !== userId) {
      throw new Error("Access denied");
    }

    // --- Pro Model Access Check (Optimized) ---
    if (modelId && role === "assistant") {
      // Only check for assistant messages (when we're about to generate)
      const modelInfo = models.find((m: any) => m.id === modelId);
      if (modelInfo && modelInfo.isApiKeyOnly) {
        // First, check if we have user-provided keys
        const userKeys = await ctx.db
          .query("apiKeys")
          .withIndex("by_user_and_service", (q) =>
            q
              .eq("userId", userId)
              .eq(
                "service",
                modelInfo.provider as
                  | "gemini"
                  | "groq"
                  | "openrouter"
                  | "deepgram"
              )
          )
          .first(); // Use first() instead of collect() for better performance

        // Then check if we have environment variables
        let hasEnvKey = false;
        if (modelInfo.provider === "gemini" && process.env.GEMINI_API_KEY) {
          hasEnvKey = true;
        } else if (modelInfo.provider === "groq" && process.env.GROQ_API_KEY) {
          hasEnvKey = true;
        } else if (
          modelInfo.provider === "openrouter" &&
          process.env.OPENROUTER_API_KEY
        ) {
          hasEnvKey = true;
        }

        // For Gemini models, we also have a hardcoded fallback key
        const hasGeminiFallback = modelInfo.provider === "gemini";

        // Only throw an error if we have no keys available
        if (!userKeys && !hasEnvKey && !hasGeminiFallback) {
          throw new Error(
            `Using ${modelInfo.name} requires you to add a valid ${modelInfo.provider} API key in settings.`
          );
        }
      }
    }
    // --- End Check ---

    const messageData: any = {
      chatId,
      role,
      content,
      modelId,
      thinking,
      thinkingDuration,
      createdAt: Date.now(),
      isComplete: isComplete ?? true,
    };

    if (attachments) {
      messageData.attachments = attachments;
    }

    // --- Title Generation (Optimized) ---
    if (
      role === "user" &&
      chat.title === "New chat" &&
      !chat.isGeneratingTitle
    ) {
      // Check if this is the first user message (more efficient)
      const existingUserMessage = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chatId))
        .filter((q) => q.eq(q.field("role"), "user"))
        .first();

      console.log("existingUserMessage", existingUserMessage);

      // If no existing user messages found, this is the first user message
      if (!existingUserMessage) {
        await ctx.db.patch(chatId, { isGeneratingTitle: true });
        await ctx.scheduler.runAfter(0, api.chat.actions.generateTitle, {
          chatId,
          messageContent: content,
          modelId: modelId || "gemini-2.0-flash-lite", // Fallback to a default model
        });
      }
    }

    const messageId = await ctx.db.insert("messages", messageData);

    // Update chat's updatedAt timestamp
    await ctx.db.patch(chatId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

export const updateMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.optional(v.string()),
    thinking: v.optional(v.string()),
    thinkingDuration: v.optional(v.number()),
    isComplete: v.optional(v.boolean()),
    isCancelled: v.optional(v.boolean()),
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
  },
  handler: async (
    ctx,
    {
      messageId,
      content,
      thinking,
      thinkingDuration,
      isComplete,
      isCancelled,
      toolCalls,
    }
  ) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify chat ownership
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Access denied");
    }

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (thinking !== undefined) updateData.thinking = thinking;
    if (thinkingDuration !== undefined)
      updateData.thinkingDuration = thinkingDuration;
    if (isComplete !== undefined) updateData.isComplete = isComplete;
    if (isCancelled !== undefined) updateData.isCancelled = isCancelled;
    if (toolCalls !== undefined) updateData.toolCalls = toolCalls;

    await ctx.db.patch(messageId, updateData);

    return messageId;
  },
});

export const cancelMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify chat ownership
    const chat = await ctx.db.get(message.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

    // Replace with direct ownership check using userId derived above
    if (chat.userId !== userId) {
      throw new Error("Access denied");
    }

    // Only allow cancellation of incomplete assistant messages
    if (message.role !== "assistant" || message.isComplete) {
      throw new Error("Cannot cancel this message");
    }

    await ctx.db.patch(messageId, {
      isCancelled: true,
      isComplete: true,
      content: message.content + "\n\n*Generation was stopped by user.*",
    });
  },
});

export const editMessage = mutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, { messageId, content }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify chat ownership
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Access denied");
    }

    // Only allow editing user messages
    if (message.role !== "user") {
      throw new Error("Only user messages can be edited");
    }

    await ctx.db.patch(messageId, { content });

    // Update chat's updatedAt timestamp
    await ctx.db.patch(message.chatId, {
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, { messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Verify chat ownership
    const chat = await ctx.db.get(message.chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(messageId);

    return { success: true };
  },
});

export const deleteMessagesFromIndex = mutation({
  args: {
    chatId: v.id("chats"),
    fromMessageId: v.id("messages"),
  },
  handler: async (ctx, { chatId, fromMessageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    // Verify chat ownership using userId
    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    // Get all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .order("asc")
      .collect();

    // Find the index of the fromMessageId
    const fromIndex = messages.findIndex((msg) => msg._id === fromMessageId);
    if (fromIndex === -1) {
      throw new Error("Message not found in chat");
    }

    // Delete all messages from that index onwards
    const messagesToDelete = messages.slice(fromIndex);
    for (const message of messagesToDelete) {
      await ctx.db.delete(message._id);
    }

    return { success: true, deletedCount: messagesToDelete.length };
  },
});

export const updateChatTitle = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, { chatId, title }) => {
    await ctx.db.patch(chatId, { title, isGeneratingTitle: false });
  },
});

export const deleteChat = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, { chatId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    // Delete all messages in the chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", chatId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete the chat
    await ctx.db.delete(chatId);

    return { success: true };
  },
});

export const deleteAllConversations = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const chat of chats) {
      const messages = await ctx.db
        .query("messages")
        .withIndex("by_chat", (q) => q.eq("chatId", chat._id))
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      await ctx.db.delete(chat._id);
    }

    return { success: true };
  },
});

export const migrateAnonymousChats = mutation({
  args: {
    chats: v.array(
      v.object({
        id: v.string(),
        title: v.string(),
        createdAt: v.number(),
        updatedAt: v.number(),
        lastMessageAt: v.number(),
      })
    ),
    messages: v.array(
      v.object({
        id: v.string(),
        conversationId: v.string(),
        content: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        createdAt: v.number(),
        model: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, { chats, messages }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required to migrate chats.");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const migratedChatIds: { [key: string]: Id<"chats"> } = {};

    // Create new chats for the authenticated user
    for (const chat of chats) {
      const newChatId = await ctx.db.insert("chats", {
        userId: userId,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      });
      migratedChatIds[chat.id] = newChatId;
    }

    // Create new messages and link them to the new chats
    for (const message of messages) {
      const newChatId = migratedChatIds[message.conversationId];
      if (newChatId) {
        // Only migrate user and assistant messages, as they are the only roles supported in the schema
        if (message.role === "user" || message.role === "assistant") {
          await ctx.db.insert("messages", {
            chatId: newChatId,
            role: message.role,
            content: message.content,
            modelId: message.model,
            createdAt: message.createdAt,
            isComplete: true,
          });
        }
      }
    }

    return { success: true, migratedCount: chats.length };
  },
});

export const renameChat = mutation({
  args: {
    chatId: v.id("chats"),
    title: v.string(),
  },
  handler: async (ctx, { chatId, title }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    await ctx.db.patch(chatId, { title });
  },
});

export const shareChat = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, { chatId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);

    const chat = await ctx.db.get(chatId);
    if (!chat || chat.userId !== userId) {
      throw new Error("Chat not found or access denied");
    }

    const shareId = Math.random().toString(36).substring(2, 15);
    await ctx.db.patch(chatId, { isShared: true, shareId });
    return shareId;
  },
});

export const branchChat = mutation({
  args: {
    chatId: v.id("chats"),
    messageId: v.id("messages"),
  },
  handler: async (ctx, { chatId, messageId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Authentication required");
    }

    const userId = await getOrCreateUserId(ctx, identity.tokenIdentifier);
    console.log("Branch chat - userId:", userId);

    const originalChat = await ctx.db.get(chatId);
    if (!originalChat || originalChat.userId !== userId) {
      console.log(
        "Access denied - originalChat.userId:",
        originalChat?.userId,
        "userId:",
        userId
      );
      throw new Error("Chat not found or access denied");
    }

    const messagesToCopy = await ctx.db
      .query("messages")
      .withIndex("by_chat_created", (q) => q.eq("chatId", chatId))
      .order("asc")
      .collect();

    const messageToBranchFromIndex = messagesToCopy.findIndex(
      (m) => m._id === messageId
    );
    if (messageToBranchFromIndex === -1) {
      console.log("Message not found - messageId:", messageId);
      throw new Error("Message not found in chat");
    }

    const messagesForNewChat = messagesToCopy.slice(
      0,
      messageToBranchFromIndex + 1
    );

    const now = Date.now();
    // Create the new chat with the correct userId
    const newChatId = await ctx.db.insert("chats", {
      userId,
      title: `Branch of ${originalChat.title}`,
      createdAt: now,
      updatedAt: now,
      isBranch: true,
    });
    console.log("Branch chat - newChatId created:", newChatId);

    // Copy messages to the new chat
    for (const message of messagesForNewChat) {
      const { _id, _creationTime, ...messageData } = message;
      await ctx.db.insert("messages", {
        ...messageData,
        chatId: newChatId,
      });
    }
    console.log(
      "Branch chat - messages copied, returning newChatId:",
      newChatId
    );

    return newChatId;
  },
});
